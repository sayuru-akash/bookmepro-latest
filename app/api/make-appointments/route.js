import connectToDatabase from "../../../Lib/mongodb";
import Appointment from "../../../models/appointment"; 
import { NextResponse } from "next/server";

// POST request: Create a new appointment
export async function POST(req) {
  const {
    name,
    email,
    phone,
    address,
    appointmentDetails,
    selectedDate,
    selectedTime,
    isIndividualSession,
    coachId,
    studentId,
  } = await req.json();

  // Validate required fields
  if (
    !name ||
    !email ||
    !phone ||
    !appointmentDetails ||
    !selectedDate ||
    !selectedTime ||
    isIndividualSession === null ||
    !coachId ||
    !studentId
  ) {
    return NextResponse.json(
      { message: "All fields are required." },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    await connectToDatabase();

    // Create a new appointment using the Appointment model
    const appointment = new Appointment({
      studentId,
      coachId,
      fullName: name,
      email,
      phone,
      address,
      appointmentDetails,
      selectedDate: new Date(selectedDate), // Ensure this is a valid date
      selectedTime,
      isIndividualSession,
      status: "pending", // Default status for new appointments
    });

    // Save the appointment to the database
    await appointment.save();

    // Return success response
    return NextResponse.json(
      { message: "Appointment booked successfully!", appointment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving appointment:", error); // Log the error to the console
    return NextResponse.json(
      { message: "Failed to book appointment.", error: error.message },
      { status: 500 }
    );
  }
}

// GET request: Fetch appointments
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const coachId = searchParams.get("coachId");
  const selectedDate = searchParams.get("selectedDate");
  const selectedTime = searchParams.get("selectedTime");

  // Validate required query parameters
  if (!coachId || !selectedDate || !selectedTime) {
    return NextResponse.json(
      { message: "Missing required query parameters." },
      { status: 400 }
    );
  }

  try {
    // Connect to the database
    await connectToDatabase();

    // Fetch appointments based on the query parameters
    const appointments = await Appointment.find({
      coachId,
      selectedDate: new Date(selectedDate),
      selectedTime,
    });

    // Return the fetched appointments
    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    console.error("Error fetching appointments:", error); // Log the error to the console
    return NextResponse.json(
      { message: "Failed to fetch appointments.", error: error.message },
      { status: 500 }
    );
  }
}