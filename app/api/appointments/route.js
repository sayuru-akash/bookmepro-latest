// app/api/appointments/route.js
import axios from "axios";
import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import User from "../../../models/user";

// Function to send status-update emails using Brevo API
async function sendEmail({
  email,
  name,
  status,
  selectedDate,
  selectedTime,
  selectedTimezone,
  appointmentId,
}) {
  const { db } = await connectToDatabase();

  // Check if status-update email already sent
  const existingAppointment = await db.collection("appointments").findOne({
    _id: new ObjectId(appointmentId),
    statusEmailSent: true,
  });

  if (existingAppointment) {
    // console.log("Status email already sent for appointment:", appointmentId);
    return;
  }

  // Format date and time
  const [startTime] = (selectedTime?.value || selectedTime || "").split(" - ");
  const dateObj = new Date(selectedDate);

  const formattedDate = dateObj.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tz = selectedTimezone || "Australia/Sydney";
  const tzAbbr =
    new Intl.DateTimeFormat("en-AU", {
      timeZone: tz,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value || tz;

  const formattedTime = new Date(
    `1970-01-01T${startTime}:00`,
  ).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const API_URL = "https://api.brevo.com/v3/smtp/email";
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  const emailData = {
    sender: { email: "bookmeprocodezela@gmail.com", name: "BookMePro" },
    to: [{ email, name }],
    subject: `Appointment on ${formattedDate} at ${formattedTime} - Status: ${status}`,
    htmlContent: `
      <p>Dear ${name},</p>
      <p>Your appointment scheduled for <strong>${formattedDate}</strong> at <strong>${formattedTime} (${tzAbbr})</strong> has been updated to: <strong>${status}</strong>.</p>
      <p>Thank you!</p>
    `,
  };

  try {
    const response = await axios.post(API_URL, emailData, {
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
    });

    // Mark status-update email as sent ONLY if successful
    await db
      .collection("appointments")
      .updateOne(
        { _id: new ObjectId(appointmentId) },
        { $set: { statusEmailSent: true } },
      );

    // console.log("Status email sent and marked successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending status email:",
      error.response?.data || error.message,
    );
    throw error;
  }
}

// POST request: Create a new appointment
export async function POST(req) {
  const {
    name,
    email,
    phone,
    appointmentDetails,
    selectedDate,
    selectedTime,
    isIndividualSession,
    coachId,
    studentId,
    selectedTimezone,
    location,
  } = await req.json();

  // Validate required fields
  if (!name || !email || !phone || !coachId || !studentId) {
    return new Response(
      JSON.stringify({ message: "Name, email, and phone are required." }),
      { status: 400 },
    );
  }

  const { db } = await connectToDatabase();

  try {
    // Validate and resolve coach ID
    let resolvedCoachId = coachId;

    // If coachId is not a valid MongoDB ID (24 chars), treat as username
    if (!ObjectId.isValid(coachId)) {
      const coach = await db.collection("users").findOne({
        username: coachId,
        role: "coach",
      });

      if (!coach) {
        return new Response(
          JSON.stringify({
            message: "Coach not found with the provided identifier.",
          }),
          { status: 404 },
        );
      }
      resolvedCoachId = coach._id.toString();
    }

    // Duplicate booking guard
    // Normalise the time value the same way as we store it below so the
    // query always matches what is actually in the database.
    const normalizedTime = selectedTime?.value ?? selectedTime;

    // location IS part of this check: same time at a different location is
    // a valid independent booking per business requirements.
    // Only same (studentId + coachId + date + time + location) is a duplicate.
    const existingBooking = await db.collection("appointments").findOne({
      studentId, // stored as plain string
      coachId: new ObjectId(resolvedCoachId),
      selectedDate: new Date(selectedDate),
      selectedTime: normalizedTime,
      location: location ?? null,
      status: { $in: ["pending", "approved"] }, // declined/cancelled are fine to rebook
    });

    if (existingBooking) {
      return new Response(
        JSON.stringify({
          message:
            "You already have an active booking for this time slot. Please check your existing appointments.",
        }),
        { status: 409 },
      );
    }

    const createdAt = new Date();
    const appointment = {
      name,
      email,
      phone,
      appointmentDetails,
      selectedDate: new Date(selectedDate),
      // Normalize: store only the time string, not the full object
      selectedTime: selectedTime?.value ?? selectedTime,
      // Preserve timezone for correct email formatting and future display
      selectedTimezone:
        selectedTime?.timezone ?? selectedTimezone ?? "Australia/Sydney",
      // Store the specific location so duplicate checks are location-scoped
      // (same time + different location is a valid, independent booking)
      location: location ?? null,
      isIndividualSession,
      // Store as ObjectId for consistent querying via Mongoose
      coachId: new ObjectId(resolvedCoachId),
      createdAt,
      status: "pending",
      statusEmailSent: false,
      dayBeforeSent: false,
      hourBeforeSent: false,
      studentId,
    };

    const result = await db.collection("appointments").insertOne(appointment);
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error) {
    console.error("Error saving appointment:", error);
    return new Response(
      JSON.stringify({
        message: "Error saving appointment.",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}

// PATCH request: Update appointment status
export async function PATCH(req) {
  const { id, status } = await req.json();

  if (!id || !status) {
    return new Response(
      JSON.stringify({ message: "Appointment ID and status are required." }),
      { status: 400 },
    );
  }

  const { db } = await connectToDatabase();

  try {
    const appointment = await db
      .collection("appointments")
      .findOne({ _id: new ObjectId(id) });

    if (!appointment) {
      return new Response(
        JSON.stringify({
          message: "No appointment found with the provided ID.",
        }),
        { status: 404 },
      );
    }

    const result = await db
      .collection("appointments")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

    if (result.modifiedCount > 0) {
      // Send status-update email after status change (non-blocking)
      sendEmail({
        email: appointment.email,
        name: appointment.name,
        status,
        selectedDate: appointment.selectedDate,
        selectedTime: appointment.selectedTime,
        selectedTimezone: appointment.selectedTimezone,
        appointmentId: id,
      }).catch((err) =>
        console.error("Status email failed (non-fatal):", err.message),
      );

      return new Response(
        JSON.stringify({
          message: `Appointment status updated to ${status}.`,
          status,
        }),
        { status: 200 },
      );
    }

    // modifiedCount === 0 means it was already that status
    return new Response(
      JSON.stringify({ message: "No changes made to the appointment." }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return new Response(
      JSON.stringify({
        message: "Error updating appointment status.",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}

// GET request: Fetch appointments with optional status filtering
export async function GET(req) {
  const { db } = await connectToDatabase();
  const url = new URL(req.url);
  const coachId = url.searchParams.get("coachId");
  const studentId = url.searchParams.get("studentId");
  const status = url.searchParams.get("status");
  const selectedDate = url.searchParams.get("selectedDate");
  const selectedTime = url.searchParams.get("selectedTime");
  const { ObjectId } = require("mongodb");

  if (!coachId) {
    return new Response(JSON.stringify({ message: "Coach ID is required." }), {
      status: 400,
    });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Resolve coach ID and fetch details
    let resolvedCoachId = coachId;
    let coachDetails = null;

    if (!ObjectId.isValid(coachId)) {
      const coach = await db.collection("users").findOne({
        username: coachId,
        role: "coach",
      });

      if (!coach) {
        return new Response(
          JSON.stringify({
            message: "Coach not found with the provided identifier.",
          }),
          { status: 404 },
        );
      }
      resolvedCoachId = coach._id.toString();
      coachDetails = {
        username: coach.username,
        name: coach.name,
        email: coach.email,
      };
    } else {
      coachDetails = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(coachId), role: "coach" },
          { projection: { username: 1, name: 1, email: 1 } },
        );

      if (!coachDetails) {
        return new Response(
          JSON.stringify({ message: "Coach not found with the provided ID." }),
          { status: 404 },
        );
      }
    }

    // Build query — match both ObjectId and legacy string coachId
    const coachIdObjectId = ObjectId.isValid(resolvedCoachId)
      ? new ObjectId(resolvedCoachId)
      : null;
    const query = {
      coachId: coachIdObjectId
        ? { $in: [coachIdObjectId, resolvedCoachId] }
        : resolvedCoachId,
      ...(status && { status }),
      selectedDate: { $gte: today },
    };

    if (selectedDate) {
      const parsedDate = new Date(selectedDate);
      if (isNaN(parsedDate)) {
        return new Response(
          JSON.stringify({ message: "Invalid selectedDate format." }),
          { status: 400 },
        );
      }

      if (status === "pending") {
        query.selectedDate = { $gte: today };
      } else {
        query.selectedDate = parsedDate;
      }
    }

    if (selectedTime) {
      query.selectedTime = selectedTime;
    }

    const appointments = await db
      .collection("appointments")
      .find(query)
      .toArray();

    const enhancedAppointments = appointments.map((appointment) => ({
      ...appointment,
      coachDetails,
    }));

    return new Response(JSON.stringify(enhancedAppointments), { status: 200 });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching appointments." }),
      { status: 500 },
    );
  }
}
