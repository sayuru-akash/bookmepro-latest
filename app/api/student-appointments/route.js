import axios from "axios"; // Axios for HTTP requests
import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";

// GET request: Fetch appointments for a specific student ID
export async function GET(req) {
  const { db } = await connectToDatabase();
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");

  if (!studentId) {
    return new Response(
      JSON.stringify({ message: "Student ID is required." }),
      {
        status: 400,
      }
    );
  }

  try {
    // First get all appointments
    const appointments = await db
      .collection("appointments")
      .find({ studentId })
      .toArray();

    // Get coach data for each appointment
    const appointmentsWithCoaches = await Promise.all(
      appointments.map(async (appointment) => {
        let coach;
        try {
          // Validate coachId before creating ObjectId
          if (appointment.coachId && ObjectId.isValid(appointment.coachId)) {
            coach = await db
              .collection("users")
              .findOne({ _id: new ObjectId(appointment.coachId) });

            if (coach) {
              // Prepare coach data with profile URL
              const coachData = {
                ...coach,
                profileUrl: coach.username 
                  ? `/coach/${coach.username}` 
                  : `/coach/${coach._id}`,
              };

              // Remove sensitive fields
              delete coachData.password;

              return {
                ...appointment,
                coach: coachData,
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching coach data for appointment ${appointment._id}:`, error);
        }

        // Return appointment with null coach if no coach found or coachId is invalid
        return {
          ...appointment,
          coach: null,
        };
      })
    );

    return new Response(JSON.stringify(appointmentsWithCoaches), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return new Response(
      JSON.stringify({ 
        message: "Error fetching appointments.",
        error: error.message
      }),
      { status: 500 }
    );
  }
}
