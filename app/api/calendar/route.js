import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import axios from "axios"; // Axios for HTTP requests
import User from "../../../models/user";

// Function to send ils using Brevo API
async function sendEmail({ email, name, status }) {
  const API_URL = "https://api.brevo.com/v3/smtp/email"; // Brevo API endpoint for transactional emails
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  const emailData = {
    sender: { email: "codezelabookmepro@gmail.com", name: "Your Company Name" },
    to: [{ email, name }],
    subject: `Your Appointment Status: ${status}`,
    htmlContent: `
      <p>Dear ${name},</p>
      <p>Your appointment status has been updated to <strong>${status}</strong>.</p>
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
    // console.log("Email sent successfully:", response.data);
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message
    );
  }
}

// PATCH request: Update appointment status
export async function PATCH(req) {
  const { id, status } = await req.json();

  if (!id || !status) {
    return new Response(
      JSON.stringify({ message: "Appointment ID and status are required." }),
      { status: 400 }
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
        { status: 404 }
      );
    }

    const result = await db
      .collection("appointments")
      .updateOne({ _id: new ObjectId(id) }, { $set: { status } });

    if (result.modifiedCount === 0) {
      return new Response(
        JSON.stringify({
          message: "Appointment status was not updated.",
        }),
        { status: 200 }
      );
    }

    // Send email after status update with all required parameters
    await sendEmail({
      email: appointment.email,
      name: appointment.name,
      status,
      selectedDate: appointment.selectedDate,
      selectedTime: appointment.selectedTime,
      appointmentId: id // Pass the appointment ID
    });
    
    return new Response(
      JSON.stringify({
        message: `Appointment status updated to ${status}.`,
        status,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return new Response(
      JSON.stringify({
        message: "Error updating appointment status.",
        error: error.message,
      }),
      { status: 500 }
    );
  }
}


export async function GET(req) {
  const { db } = await connectToDatabase();
  const url = new URL(req.url);
  const coachId = url.searchParams.get("coachId");
  const status = url.searchParams.get("status");
  const selectedDate = url.searchParams.get("selectedDate");
  const selectedTime = url.searchParams.get("selectedTime");

  if (!coachId) {
    return new Response(JSON.stringify({ message: "Coach ID is required." }), {
      status: 400,
    });
  }

  try {
    const query = {
      coachId,
      ...(status && { status }), // Add status filter if provided
    };

    // Modified date filtering logic
    if (selectedDate) {
      // Parse the selected date
      const parsedDate = new Date(selectedDate);
      if (isNaN(parsedDate)) {
        return new Response(
          JSON.stringify({ message: "Invalid selectedDate format." }),
          { status: 400 }
        );
      }

      // Create start and end of the selected date
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Add date range query
      query.selectedDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Add selectedTime filter if provided
    if (selectedTime) {
      query.selectedTime = selectedTime;
    }

    const appointments = await db
      .collection("appointments")
      .find(query)
      .toArray();

    return new Response(JSON.stringify(appointments), { status: 200 });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching appointments." }),
      { status: 500 }
    );
  }
}