import connectToDatabase from "../../../Lib/mongodb";
import Appointment from "../../../models/appointment"; 
import { NextResponse } from "next/server";

// GET request: Fetch specific appointment details by studentId
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
  
    // Validate required query parameters
    if (!studentId) {
      return NextResponse.json(
        { message: "Missing required query parameter: studentId." },
        { status: 400 }
      );
    }
  
    try {
      // Connect to the database
      await connectToDatabase();
  
      // Fetch appointments based on the studentId
      // Select only the specific fields you need
      const appointments = await Appointment.find({ studentId })
        .select('selectedDate selectedTime status appointmentDetails');
  
      // Return the fetched appointments with selected fields
      return NextResponse.json(appointments, { status: 200 });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return NextResponse.json(
        { message: "Failed to fetch appointments.", error: error.message },
        { status: 500 }
      );
    }
}