// app/api/available_dates/route.js

import connectToDatabase from "../../../Lib/mongodb";
import mongoose from "mongoose";
import AvailableDate from "../../../models/AvailableDate";
import User from "../../../models/user";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { ObjectId } from "mongodb";

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// POST request: Create a new available date or update if it already exists
export async function POST(req) {
  const { date, timeSlots, coachId, timezone } = await req.json();

  // Validate required fields
  if (!date || !timeSlots || !coachId || !timezone) {
    return new Response(
      JSON.stringify({
        message: "Date, timeSlots, and coachId are required.",
      }),
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const dateObj = new Date(date);

    // Make sure each time slot has timezone info
    const timeSlotsWithTimezone = timeSlots.map((slot) => ({
      ...slot,
      timezone: slot.timezone || timezone,
    }));

    const updatedDate = await AvailableDate.findOneAndUpdate(
      { coachId: new mongoose.Types.ObjectId(coachId), date: dateObj },
      {
        $set: {
          slots: timeSlots.length,
          timezone, // Store the overall timezone for the date
          timeSlots: timeSlotsWithTimezone,
        },
      },
      { upsert: true, new: true },
    );

    return new Response(JSON.stringify(updatedDate), { status: 200 });
  } catch (error) {
    console.error("Error saving/updating available date:", error);
    return new Response(
      JSON.stringify({
        message: "Error saving/updating available date.",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}

// GET request: Fetch all available dates for a specific coach
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const param = searchParams.get("coachId") || searchParams.get("username");
  // When ?coach=true the caller is the coach's own management view.
  // Return all slots as stored — never filter out booked ones.
  // Student-facing booking calendar does NOT pass this flag.
  const isCoachView = searchParams.get("coach") === "true";

  try {
    await connectToDatabase();

    if (!param) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "coachId or username parameter is required",
        }),
        { status: 400 },
      );
    }

    // Optimized ID/username resolution
    let coachId;
    const isPotentialId =
      param.length === 24 && mongoose.Types.ObjectId.isValid(param);

    if (isPotentialId) {
      // Verify ID actually exists
      const coachExists = await User.exists({ _id: param });
      coachId = coachExists ? param : null;
    }

    if (!isPotentialId || !coachId) {
      // Handle as username if not a valid ID
      const user = await User.findOne({
        username: { $regex: new RegExp(`^${param}$`, "i") },
      });
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Coach not found",
          }),
          { status: 404 },
        );
      }
      coachId = user._id.toString();
    }

    // Get the current date at midnight (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch available dates for the coach that are today or later
    const availableDates = await AvailableDate.find({
      coachId: new mongoose.Types.ObjectId(coachId),
      date: { $gte: today },
    });

    // Coach management view: return all slots exactly as stored.
    // No booking filter applied — the coach must always see their full schedule.
    if (isCoachView) {
      const allDates = availableDates.map((d) => d.toObject());
      return new Response(JSON.stringify(allDates), { status: 200 });
    }

    // Student booking calendar: filter out slots that are already booked.
    // Use native driver to handle both ObjectId and legacy string coachId values
    const coachObjectId = new mongoose.Types.ObjectId(coachId);
    const appointmentsCollection =
      mongoose.connection.collection("appointments");
    const appointments = await appointmentsCollection
      .find({
        coachId: { $in: [coachObjectId, coachId] },
        selectedDate: { $gte: today },
        status: { $in: ["pending", "Approved"] },
      })
      .toArray();

    // Process each available date: filter out booked time slots for individual sessions
    const processedDates = availableDates.map((availableDate) => {
      const dateStr = new Date(availableDate.date).toISOString().split("T")[0];
      const filteredTimeSlots = availableDate.timeSlots.filter((slot) => {
        // Always keep multiple booking slots
        if (slot.multipleBookings) {
          return true;
        }

        // Check if an individual booking exists for this slot.
        // Both time AND location must match so that a booking at
        // "Cricket Net 1" does not hide a sibling slot at "Cricket Net 2".
        const isBooked = appointments.some((appointment) => {
          const appointmentDateStr = new Date(appointment.selectedDate)
            .toISOString()
            .split("T")[0];
          // selectedTime is stored as an object {value, timezone, slotData} or plain string
          const appointmentTime =
            appointment.selectedTime?.value ?? appointment.selectedTime;
          const appointmentLocation = appointment.location ?? null;
          const slotLocation = slot.location ?? null;
          return (
            appointmentDateStr === dateStr &&
            appointmentTime === slot.time &&
            appointment.isIndividualSession === true &&
            appointmentLocation === slotLocation
          );
        });
        return !isBooked;
      });

      return {
        ...availableDate.toObject(),
        timeSlots: filteredTimeSlots,
      };
    });

    // Remove dates with no available time slots
    const finalDates = processedDates.filter(
      (date) => date.timeSlots.length > 0,
    );

    return new Response(JSON.stringify(finalDates), { status: 200 });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    return new Response(
      JSON.stringify({
        message: "Error fetching available dates.",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}

// DELETE request: Remove an available date by ID
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ message: "ID is required." }), {
      status: 400,
    });
  }

  try {
    await connectToDatabase();
    const result = await AvailableDate.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ message: "No available date found." }),
        { status: 404 },
      );
    }

    return new Response(
      JSON.stringify({ message: "Available date deleted successfully." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting available date:", error);
    return new Response(
      JSON.stringify({
        message: "Error deleting available date.",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}

// PUT request: Update time slots for a specific available date
export async function PUT(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ message: "ID is required." }), {
      status: 400,
    });
  }

  // Validate if the ID is a valid ObjectId string
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ message: "Invalid ID format." }), {
      status: 400,
    });
  }
  const objectId = new mongoose.Types.ObjectId(id); // Convert string ID to ObjectId

  const { timeSlots } = await req.json();

  // When ?replace=true is passed the incoming timeSlots list fully replaces
  // the stored list (used by the coach delete-slot action).
  // Without the flag the request is an add/merge operation (default).
  const replaceMode = searchParams.get("replace") === "true";

  if (!Array.isArray(timeSlots)) {
    return new Response(
      JSON.stringify({ message: "timeSlots must be an array." }),
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();

    const existingDate = await AvailableDate.findById(objectId);
    if (!existingDate) {
      return new Response(
        JSON.stringify({
          message: "No available date found with the provided ID.",
        }),
        { status: 404 },
      );
    }

    let finalSlots;
    if (replaceMode) {
      // Pure replace — coach is deleting/reordering existing slots.
      finalSlots = timeSlots;
    } else {
      // Merge new and old time slots.
      // Dedup key is the composite "time|location" so that:
      //   • same time + same location → kept once (duplicate removed)
      //   • same time + different location → both kept (valid distinct venues)
      const mergedSlots = [...existingDate.timeSlots, ...timeSlots];
      finalSlots = Array.from(
        new Map(
          mergedSlots.map((slot) => [
            `${slot.time}|${slot.location || ""}`,
            slot,
          ]),
        ).values(),
      );
    }

    const result = await AvailableDate.updateOne(
      { _id: objectId },
      {
        $set: {
          timeSlots: finalSlots,
          slots: finalSlots.length,
        },
      },
    );

    return new Response(
      JSON.stringify({
        message: "Time slots updated successfully.",
        updatedSlots: finalSlots.length,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating time slots:", error);
    return new Response(
      JSON.stringify({
        message: "Error updating time slots.",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}
