import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import {
  requireSession,
  errorResponse,
} from "../../../Lib/auth/requireSession";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUSES,
  appointmentCapacityTransition,
  appointmentInterval,
  intervalsOverlap,
  normalizeAppointmentStatus,
} from "../../../Lib/booking/time";
import { busyIntervalsForOwner } from "../../../Lib/integrations/googleCalendar";
import {
  enqueueCalendarSync,
  drainCalendarOutbox,
} from "../../../Lib/integrations/calendarOutbox";
import {
  cancelAppointmentReminders,
  drainNotificationOutbox,
  enqueueAppointmentNotifications,
  scheduleAppointmentReminders,
} from "../../../Lib/notifications/outbox";

const SAFE_PROJECTION = {
  name: 1,
  email: 1,
  phone: 1,
  appointmentDetails: 1,
  selectedDate: 1,
  selectedTime: 1,
  selectedTimezone: 1,
  timeZone: 1,
  startAt: 1,
  endAt: 1,
  location: 1,
  status: 1,
  coachId: 1,
  studentId: 1,
  isIndividualSession: 1,
  multipleBookings: 1,
  capacity: 1,
  googleMeetLink: 1,
  externalCalendarHtmlLink: 1,
  calendarSyncError: 1,
  version: 1,
  createdAt: 1,
  updatedAt: 1,
};

function idsFor(value) {
  const text = String(value);
  return ObjectId.isValid(text) ? [new ObjectId(text), text] : [text];
}

async function resolveCoach(db, value) {
  const query = ObjectId.isValid(value)
    ? { _id: new ObjectId(value), role: "coach" }
    : {
        username: {
          $regex: `^${String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
        role: "coach",
      };
  return db.collection("users").findOne(query);
}

function slotGroupKey({ coachId, startAt, endAt, location }) {
  return crypto
    .createHash("sha256")
    .update(
      `${coachId}|${new Date(startAt).toISOString()}|${new Date(endAt).toISOString()}|${location || ""}`,
    )
    .digest("hex");
}

async function ensureBookingIndexes(db) {
  await Promise.all([
    db
      .collection("appointments")
      .createIndex(
        { idempotencyKey: 1 },
        { unique: true, sparse: true, name: "booking_idempotency" },
      ),
    db
      .collection("appointments")
      .createIndex(
        { coachId: 1, startAt: 1, endAt: 1, status: 1 },
        { name: "booking_conflicts" },
      ),
    db
      .collection("appointments")
      .createIndex(
        { studentId: 1, startAt: 1, status: 1 },
        { name: "student_schedule" },
      ),
  ]);
}

async function findAvailabilitySlot(
  db,
  coachId,
  dateKey,
  selectedTime,
  location,
) {
  const dateStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dateEnd = new Date(`${dateKey}T23:59:59.999Z`);
  const document = await db.collection("availabledates").findOne({
    coachId: new ObjectId(coachId),
    date: { $gte: dateStart, $lte: dateEnd },
  });
  const normalizedLocation = location || null;
  const slot = document?.timeSlots?.find(
    (item) =>
      item.time === selectedTime &&
      (item.location || null) === normalizedLocation,
  );
  return { document, slot };
}

async function reserveCapacity(db, { groupKey, capacity, activeCount }) {
  await db.collection("bookingCapacity").updateOne(
    { _id: groupKey },
    {
      $setOnInsert: { activeCount, createdAt: new Date() },
      $set: { capacity, updatedAt: new Date() },
    },
    { upsert: true },
  );
  const reserved = await db
    .collection("bookingCapacity")
    .findOneAndUpdate(
      { _id: groupKey, activeCount: { $lt: capacity } },
      { $inc: { activeCount: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  return Boolean(reserved);
}

async function decrementCapacity(db, groupKey) {
  if (!groupKey) return;
  await db.collection("bookingCapacity").updateOne(
    { _id: groupKey, activeCount: { $gt: 0 } },
    { $inc: { activeCount: -1 }, $set: { updatedAt: new Date() } },
  );
}

async function runLifecycleJobs(db, appointment) {
  await enqueueCalendarSync(db, appointment);
  await drainCalendarOutbox({ appointmentId: appointment._id, limit: 5 });
  await drainNotificationOutbox({ appointmentId: appointment._id, limit: 10 });
}

export async function POST(request) {
  let capacityReserved = null;
  try {
    const session = await requireSession(["student"]);
    const body = await request.json();
    const selectedTime = body.selectedTime?.value ?? body.selectedTime;
    if (!body.coachId || !body.selectedDate || !selectedTime) {
      return Response.json(
        { message: "Coach, date, and time are required." },
        { status: 400 },
      );
    }

    const connection = await connectToDatabase();
    const db = connection.db;
    await ensureBookingIndexes(db);
    const [coach, student] = await Promise.all([
      resolveCoach(db, body.coachId),
      db.collection("students").findOne({ _id: new ObjectId(session.user.id) }),
    ]);
    if (!coach)
      return Response.json({ message: "Coach not found." }, { status: 404 });
    if (!student)
      return Response.json(
        { message: "Student account not found." },
        { status: 404 },
      );
    if (!student.emailVerifiedAt) {
      return Response.json(
        { message: "Verify your email before booking a session." },
        { status: 403 },
      );
    }
    const clientIdempotencyKey = String(
      request.headers.get("idempotency-key") ||
        body.idempotencyKey ||
        crypto.randomUUID(),
    ).slice(0, 200);
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${student._id}:${clientIdempotencyKey}`)
      .digest("hex");
    const priorAttempt = await db.collection("appointments").findOne({
      idempotencyKey,
      studentId: { $in: idsFor(student._id) },
    });
    if (priorAttempt) return Response.json(priorAttempt, { status: 200 });

    const requestedZone =
      body.selectedTime?.timezone || body.selectedTimezone || coach.timezone;
    const interval = appointmentInterval({
      date: body.selectedDate,
      time: selectedTime,
      timeZone: requestedZone,
    });
    if (new Date(interval.startAt) <= new Date()) {
      return Response.json(
        { message: "This appointment time has already passed." },
        { status: 400 },
      );
    }

    const location = body.selectedTime?.location ?? body.location ?? null;
    const { slot } = await findAvailabilitySlot(
      db,
      coach._id,
      interval.dateKey,
      selectedTime,
      location,
    );
    if (!slot)
      return Response.json(
        { message: "This time slot is no longer available." },
        { status: 409 },
      );
    const multipleBookings = Boolean(slot.multipleBookings);
    const capacity = multipleBookings
      ? Math.max(2, Math.min(500, Number(slot.capacity || 25)))
      : 1;
    const groupKey = slotGroupKey({
      coachId: coach._id,
      ...interval,
      location,
    });

    const duplicate = await db.collection("appointments").findOne({
      studentId: { $in: idsFor(student._id) },
      groupKey,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });
    if (duplicate) {
      return Response.json(
        { message: "You already have an active booking for this session." },
        { status: 409 },
      );
    }

    const [coachGoogleBusy, studentGoogleBusy] = await Promise.all([
      busyIntervalsForOwner("coach", coach._id, {
        timeMin: interval.startAt,
        timeMax: interval.endAt,
      }),
      busyIntervalsForOwner("student", student._id, {
        timeMin: interval.startAt,
        timeMax: interval.endAt,
      }),
    ]);
    if (
      coachGoogleBusy.some((busy) =>
        intervalsOverlap(
          interval.startAt,
          interval.endAt,
          busy.start,
          busy.end,
        ),
      )
    ) {
      return Response.json(
        {
          message:
            "The coach is no longer available at this time. Please choose another slot.",
        },
        { status: 409 },
      );
    }
    if (
      studentGoogleBusy.some((busy) =>
        intervalsOverlap(
          interval.startAt,
          interval.endAt,
          busy.start,
          busy.end,
        ),
      )
    ) {
      return Response.json(
        {
          message:
            "This overlaps an event in your connected Google Calendar. Please choose another slot.",
        },
        { status: 409 },
      );
    }

    const activeCount = await db.collection("appointments").countDocuments({
      groupKey,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    });
    if (
      activeCount >= capacity ||
      !(await reserveCapacity(db, { groupKey, capacity, activeCount }))
    ) {
      return Response.json(
        { message: "This session has just reached capacity." },
        { status: 409 },
      );
    }
    capacityReserved = { db, groupKey };

    const now = new Date();
    const appointment = {
      name: student.name || student.fullName,
      email: String(student.email).toLowerCase(),
      phone: student.phone,
      address: student.address || "",
      appointmentDetails: String(body.appointmentDetails || "")
        .trim()
        .slice(0, 2000),
      selectedDate: new Date(`${interval.dateKey}T00:00:00.000Z`),
      selectedTime,
      selectedTimezone: interval.timeZone,
      timeZone: interval.timeZone,
      startAt: interval.startAt,
      endAt: interval.endAt,
      location,
      isIndividualSession: !multipleBookings,
      multipleBookings,
      capacity,
      groupKey,
      coachId: coach._id,
      studentId: student._id,
      status: "pending",
      version: 1,
      idempotencyKey,
      reservationReleased: false,
      statusEmailSent: false,
      createdAt: now,
      updatedAt: now,
    };
    let result;
    try {
      result = await db.collection("appointments").insertOne(appointment);
    } catch (error) {
      if (error.code === 11000) {
        await db
          .collection("bookingCapacity")
          .updateOne(
            { _id: groupKey, activeCount: { $gt: 0 } },
            { $inc: { activeCount: -1 } },
          );
        const existing = await db.collection("appointments").findOne({
          idempotencyKey,
          studentId: { $in: idsFor(student._id) },
        });
        return Response.json(existing, { status: 200 });
      }
      throw error;
    }
    capacityReserved = null;
    appointment._id = result.insertedId;
    await enqueueAppointmentNotifications(db, appointment, "created");
    await runLifecycleJobs(db, appointment);
    return Response.json(appointment, { status: 201 });
  } catch (error) {
    if (capacityReserved) {
      await capacityReserved.db
        .collection("bookingCapacity")
        .updateOne(
          { _id: capacityReserved.groupKey, activeCount: { $gt: 0 } },
          { $inc: { activeCount: -1 } },
        )
        .catch(() => {});
    }
    console.error("Appointment creation failed:", error);
    return errorResponse(error, "Unable to create the appointment.");
  }
}

export async function PATCH(request) {
  let provisionalCapacity = null;
  try {
    const session = await requireSession(["coach", "student"]);
    const body = await request.json();
    if (!ObjectId.isValid(body.id))
      return Response.json(
        { message: "A valid appointment is required." },
        { status: 400 },
      );
    const connection = await connectToDatabase();
    const db = connection.db;
    let appointment = await db
      .collection("appointments")
      .findOne({ _id: new ObjectId(body.id) });
    if (!appointment)
      return Response.json(
        { message: "Appointment not found." },
        { status: 404 },
      );

    const isCoach =
      session.user.role === "coach" &&
      idsFor(appointment.coachId).some((id) => String(id) === session.user.id);
    const isStudent =
      session.user.role === "student" &&
      idsFor(appointment.studentId).some(
        (id) => String(id) === session.user.id,
      );
    if (!isCoach && !isStudent)
      return Response.json(
        { message: "You do not own this booking." },
        { status: 403 },
      );

    const previousStatus = normalizeAppointmentStatus(appointment.status);
    const requestedStatus = normalizeAppointmentStatus(
      body.status || previousStatus,
    );
    if (!APPOINTMENT_STATUSES.includes(requestedStatus)) {
      return Response.json(
        { message: "Invalid appointment status." },
        { status: 400 },
      );
    }
    if (isStudent && !["cancelled", previousStatus].includes(requestedStatus)) {
      return Response.json(
        { message: "Students can cancel or reschedule their own bookings." },
        { status: 403 },
      );
    }
    if (
      isCoach &&
      ![
        "approved",
        "declined",
        "cancelled",
        "completed",
        "no_show",
        previousStatus,
      ].includes(requestedStatus)
    ) {
      return Response.json(
        { message: "That booking transition is not allowed." },
        { status: 409 },
      );
    }

    const update = { status: requestedStatus, updatedAt: new Date() };
    let transition =
      requestedStatus !== previousStatus ? requestedStatus : null;
    let nextGroupKey = appointment.groupKey;
    let nextCapacity = Number(appointment.capacity || 1);
    let groupChanged = false;
    const isReschedule = Boolean(
      body.selectedDate && (body.selectedTime?.value || body.selectedTime),
    );
    if (isReschedule) {
      const selectedTime = body.selectedTime?.value ?? body.selectedTime;
      const interval = appointmentInterval({
        date: body.selectedDate,
        time: selectedTime,
        timeZone:
          body.selectedTime?.timezone ||
          body.selectedTimezone ||
          appointment.timeZone,
      });
      if (new Date(interval.startAt) <= new Date())
        return Response.json(
          { message: "Select a future time." },
          { status: 400 },
        );
      const location =
        body.selectedTime?.location ??
        body.location ??
        appointment.location ??
        null;
      const { slot } = await findAvailabilitySlot(
        db,
        appointment.coachId,
        interval.dateKey,
        selectedTime,
        location,
      );
      if (!slot)
        return Response.json(
          { message: "The requested time is no longer available." },
          { status: 409 },
        );
      const timeChanged =
        new Date(interval.startAt).getTime() !==
          new Date(appointment.startAt).getTime() ||
        new Date(interval.endAt).getTime() !==
          new Date(appointment.endAt).getTime();
      const [coachBusy, studentBusy] = timeChanged
        ? await Promise.all([
            busyIntervalsForOwner("coach", appointment.coachId, {
              timeMin: interval.startAt,
              timeMax: interval.endAt,
            }),
            busyIntervalsForOwner("student", appointment.studentId, {
              timeMin: interval.startAt,
              timeMax: interval.endAt,
            }),
          ])
        : [[], []];
      if (
        coachBusy.some((item) =>
          intervalsOverlap(
            interval.startAt,
            interval.endAt,
            item.start,
            item.end,
          ),
        )
      ) {
        return Response.json(
          { message: "The coach is busy at the requested time." },
          { status: 409 },
        );
      }
      if (
        studentBusy.some((item) =>
          intervalsOverlap(
            interval.startAt,
            interval.endAt,
            item.start,
            item.end,
          ),
        )
      ) {
        return Response.json(
          {
            message:
              "The requested time overlaps the student’s connected Google Calendar.",
          },
          { status: 409 },
        );
      }
      const multipleBookings = Boolean(slot.multipleBookings);
      const capacity = multipleBookings
        ? Math.max(2, Math.min(500, Number(slot.capacity || 25)))
        : 1;
      nextGroupKey = slotGroupKey({
        coachId: appointment.coachId,
        ...interval,
        location,
      });
      nextCapacity = capacity;
      groupChanged = nextGroupKey !== appointment.groupKey;
      Object.assign(update, {
        selectedDate: new Date(`${interval.dateKey}T00:00:00.000Z`),
        selectedTime,
        selectedTimezone: interval.timeZone,
        timeZone: interval.timeZone,
        startAt: interval.startAt,
        endAt: interval.endAt,
        location,
        isIndividualSession: !multipleBookings,
        multipleBookings,
        capacity: nextCapacity,
        groupKey: nextGroupKey,
        status: isStudent ? "pending" : requestedStatus,
      });
      transition = "rescheduled";
    }

    const capacityTransition = appointmentCapacityTransition({
      previousStatus,
      nextStatus: update.status,
      reservationReleased: appointment.reservationReleased,
      groupChanged,
    });
    update.reservationReleased = capacityTransition.reservationReleased;

    if (capacityTransition.reserveNext) {
      const duplicate = await db.collection("appointments").findOne({
        _id: { $ne: appointment._id },
        studentId: { $in: idsFor(appointment.studentId) },
        groupKey: nextGroupKey,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
      });
      if (duplicate) {
        return Response.json(
          {
            message:
              "The student already has an active booking for this session.",
          },
          { status: 409 },
        );
      }
      const activeCount = await db.collection("appointments").countDocuments({
        groupKey: nextGroupKey,
        status: { $in: ACTIVE_APPOINTMENT_STATUSES },
        _id: { $ne: appointment._id },
      });
      if (
        activeCount >= nextCapacity ||
        !(await reserveCapacity(db, {
          groupKey: nextGroupKey,
          capacity: nextCapacity,
          activeCount,
        }))
      ) {
        return Response.json(
          { message: "The requested session is full." },
          { status: 409 },
        );
      }
      provisionalCapacity = { db, groupKey: nextGroupKey };
    }
    const filter = { _id: appointment._id };
    if (body.version) filter.version = Number(body.version);
    const result = await db
      .collection("appointments")
      .findOneAndUpdate(
        filter,
        { $set: update, $inc: { version: 1 } },
        { returnDocument: "after" },
      );
    if (!result) {
      if (provisionalCapacity) {
        await decrementCapacity(
          provisionalCapacity.db,
          provisionalCapacity.groupKey,
        );
        provisionalCapacity = null;
      }
      return Response.json(
        { message: "This booking changed elsewhere. Refresh and try again." },
        { status: 409 },
      );
    }
    provisionalCapacity = null;
    if (capacityTransition.releasePrevious) {
      await decrementCapacity(db, appointment.groupKey);
    }
    if (isReschedule || result.status !== "approved") {
      await cancelAppointmentReminders(db, appointment);
    }
    appointment = result;

    if (transition)
      await enqueueAppointmentNotifications(db, appointment, transition);
    await runLifecycleJobs(db, appointment);
    appointment = await db
      .collection("appointments")
      .findOne({ _id: appointment._id });
    const coach = await db
      .collection("users")
      .findOne({ _id: new ObjectId(appointment.coachId) });
    if (appointment.status === "approved") {
      await scheduleAppointmentReminders(db, appointment, coach).catch(
        (error) => console.error("Reminder scheduling deferred:", error),
      );
    }
    return Response.json(appointment);
  } catch (error) {
    if (provisionalCapacity) {
      await decrementCapacity(
        provisionalCapacity.db,
        provisionalCapacity.groupKey,
      ).catch(() => {});
    }
    console.error("Appointment update failed:", error);
    return errorResponse(error, "Unable to update the appointment.");
  }
}

export async function GET(request) {
  try {
    const session = await requireSession(["coach", "student", "admin"]);
    const connection = await connectToDatabase();
    const db = connection.db;
    const url = new URL(request.url);
    const query = {};
    if (session.user.role === "coach")
      query.coachId = { $in: idsFor(session.user.id) };
    if (session.user.role === "student")
      query.studentId = { $in: idsFor(session.user.id) };
    if (session.user.role === "admin") {
      const coachId = url.searchParams.get("coachId");
      const studentId = url.searchParams.get("studentId");
      if (coachId) query.coachId = { $in: idsFor(coachId) };
      if (studentId) query.studentId = { $in: idsFor(studentId) };
    }
    const status = normalizeAppointmentStatus(url.searchParams.get("status"));
    if (status)
      query.status = {
        $in: [status, status[0].toUpperCase() + status.slice(1)],
      };
    const selectedDate = url.searchParams.get("selectedDate");
    if (selectedDate) {
      const start = new Date(`${selectedDate.slice(0, 10)}T00:00:00.000Z`);
      const end = new Date(`${selectedDate.slice(0, 10)}T23:59:59.999Z`);
      query.selectedDate = { $gte: start, $lte: end };
    } else if (url.searchParams.get("includePast") !== "true") {
      query.$or = [
        { startAt: { $gte: new Date() } },
        { startAt: { $exists: false }, selectedDate: { $gte: new Date() } },
      ];
    }
    const selectedTime = url.searchParams.get("selectedTime");
    if (selectedTime) query.selectedTime = selectedTime;
    const appointments = await db
      .collection("appointments")
      .find(query, { projection: SAFE_PROJECTION })
      .sort({ startAt: 1, selectedDate: 1 })
      .limit(1000)
      .toArray();
    return Response.json(
      appointments.map((item) => ({
        ...item,
        status: normalizeAppointmentStatus(item.status),
      })),
    );
  } catch (error) {
    return errorResponse(error, "Unable to load appointments.");
  }
}
