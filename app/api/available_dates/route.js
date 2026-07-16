import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import AvailableDate from "../../../models/AvailableDate";
import User from "../../../models/user";
import {
  requireSession,
  errorResponse,
} from "../../../Lib/auth/requireSession";
import {
  appointmentInterval,
  intervalsOverlap,
} from "../../../Lib/booking/time";
import { busyIntervalsForOwner } from "../../../Lib/integrations/googleCalendar";

function sanitizeSlots(slots, fallbackZone) {
  if (!Array.isArray(slots))
    throw Object.assign(new Error("timeSlots must be an array."), {
      status: 400,
    });
  return slots.map((slot) => ({
    time: String(slot.time || "").trim(),
    multipleBookings: Boolean(slot.multipleBookings),
    capacity: slot.multipleBookings
      ? Math.max(2, Math.min(500, Number(slot.capacity || 25)))
      : 1,
    timezone: slot.timezone || fallbackZone,
    location: slot.location || null,
  }));
}

async function coachContext(value) {
  await connectToDatabase();
  if (!value)
    throw Object.assign(new Error("Coach is required."), { status: 400 });
  const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const coach = ObjectId.isValid(value)
    ? await User.findOne({ _id: value, role: "coach" }).lean()
    : await User.findOne({
        username: { $regex: `^${escaped}$`, $options: "i" },
        role: "coach",
      }).lean();
  if (!coach)
    throw Object.assign(new Error("Coach not found."), { status: 404 });
  return coach;
}

async function requireCoachOwnership(coachId) {
  const session = await requireSession(["coach"]);
  if (String(session.user.id) !== String(coachId)) {
    throw Object.assign(
      new Error("You can only manage your own availability."),
      { status: 403 },
    );
  }
  return session;
}

export async function POST(request) {
  try {
    const body = await request.json();
    await requireCoachOwnership(body.coachId);
    const coach = await coachContext(body.coachId);
    const dateKey = String(body.date || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey))
      return Response.json(
        { message: "A valid date is required." },
        { status: 400 },
      );
    const timezone = body.timezone || coach.timezone || "Australia/Sydney";
    const timeSlots = sanitizeSlots(body.timeSlots, timezone);
    for (const slot of timeSlots)
      appointmentInterval({
        date: dateKey,
        time: slot.time,
        timeZone: slot.timezone,
      });
    const updated = await AvailableDate.findOneAndUpdate(
      { coachId: coach._id, date: new Date(`${dateKey}T00:00:00.000Z`) },
      { $set: { slots: timeSlots.length, timezone, timeSlots } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return Response.json(updated);
  } catch (error) {
    return errorResponse(error, "Unable to save availability.");
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const coach = await coachContext(
      searchParams.get("coachId") || searchParams.get("username"),
    );
    const isCoachView = searchParams.get("coach") === "true";
    if (isCoachView) await requireCoachOwnership(coach._id);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dates = await AvailableDate.find({
      coachId: coach._id,
      date: { $gte: today },
    })
      .sort({ date: 1 })
      .lean();
    if (isCoachView || !dates.length) return Response.json(dates);

    const lastDate = new Date(dates.at(-1).date);
    lastDate.setUTCDate(lastDate.getUTCDate() + 2);
    const [appointments, busyIntervals] = await Promise.all([
      mongoose.connection
        .collection("appointments")
        .find({
          coachId: { $in: [coach._id, String(coach._id)] },
          selectedDate: { $gte: today },
          status: { $in: ["pending", "approved", "Approved"] },
        })
        .toArray(),
      busyIntervalsForOwner("coach", coach._id, {
        timeMin: today,
        timeMax: lastDate,
      }),
    ]);

    const result = dates
      .map((date) => {
        const dateKey = new Date(date.date).toISOString().slice(0, 10);
        const timeSlots = (date.timeSlots || []).flatMap((slot) => {
          const interval = appointmentInterval({
            date: dateKey,
            time: slot.time,
            timeZone: slot.timezone || date.timezone || coach.timezone,
          });
          if (
            busyIntervals.some((busy) =>
              intervalsOverlap(
                interval.startAt,
                interval.endAt,
                busy.start,
                busy.end,
              ),
            )
          )
            return [];
          const sameSlot = appointments.filter((appointment) => {
            const matches = appointment.startAt
              ? new Date(appointment.startAt).getTime() ===
                new Date(interval.startAt).getTime()
              : new Date(appointment.selectedDate)
                  .toISOString()
                  .slice(0, 10) === dateKey &&
                (appointment.selectedTime?.value ??
                  appointment.selectedTime) === slot.time;
            return (
              matches &&
              (appointment.location || null) === (slot.location || null)
            );
          });
          const capacity = slot.multipleBookings
            ? Math.max(2, Number(slot.capacity || 25))
            : 1;
          const remaining = Math.max(0, capacity - sameSlot.length);
          return remaining
            ? [{ ...slot, capacity, capacityRemaining: remaining }]
            : [];
        });
        return { ...date, timeSlots };
      })
      .filter((date) => date.timeSlots.length);
    return Response.json(result);
  } catch (error) {
    console.error("Availability load failed:", error);
    return errorResponse(error, "Unable to load live availability.");
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!ObjectId.isValid(id))
      return Response.json(
        { message: "A valid availability record is required." },
        { status: 400 },
      );
    await connectToDatabase();
    const existing = await AvailableDate.findById(id).lean();
    if (!existing)
      return Response.json(
        { message: "Availability not found." },
        { status: 404 },
      );
    await requireCoachOwnership(existing.coachId);
    const body = await request.json();
    const incoming = sanitizeSlots(
      body.timeSlots,
      existing.timezone || "Australia/Sydney",
    );
    const combined =
      url.searchParams.get("replace") === "true"
        ? incoming
        : [...existing.timeSlots, ...incoming];
    const finalSlots = Array.from(
      new Map(
        combined.map((slot) => [`${slot.time}|${slot.location || ""}`, slot]),
      ).values(),
    );
    for (const slot of finalSlots)
      appointmentInterval({
        date: existing.date,
        time: slot.time,
        timeZone: slot.timezone || existing.timezone,
      });
    await AvailableDate.updateOne(
      { _id: id },
      { $set: { timeSlots: finalSlots, slots: finalSlots.length } },
    );
    return Response.json({
      message: "Availability updated.",
      timeSlots: finalSlots,
    });
  } catch (error) {
    return errorResponse(error, "Unable to update availability.");
  }
}

export async function DELETE(request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!ObjectId.isValid(id))
      return Response.json(
        { message: "A valid availability record is required." },
        { status: 400 },
      );
    await connectToDatabase();
    const existing = await AvailableDate.findById(id).lean();
    if (!existing)
      return Response.json(
        { message: "Availability not found." },
        { status: 404 },
      );
    await requireCoachOwnership(existing.coachId);
    await AvailableDate.deleteOne({ _id: id });
    return Response.json({ message: "Availability removed." });
  } catch (error) {
    return errorResponse(error, "Unable to remove availability.");
  }
}
