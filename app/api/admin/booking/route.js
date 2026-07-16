// app/api/admin/booking/route.js
import connectToDatabase from "../../../../Lib/mongodb";
import Appointment from "../../../../models/appointment";
import User from "../../../../models/user";
import {
  errorResponse,
  requireSession,
} from "../../../../Lib/auth/requireSession";

export async function GET(req) {
  try {
    await requireSession(["admin"]);
    await connectToDatabase();
    const appointments = await Appointment.find(
      {},
      "name selectedDate selectedTime status appointmentDetails coachId",
    ).sort({ createdAt: -1 });

    // Enhance each appointment with the coach's name from the User collection
    const appointmentsWithCoach = await Promise.all(
      appointments.map(async (appointment) => {
        let coachName = "Unknown Coach";
        if (appointment.coachId) {
          const coach = await User.findById(
            appointment.coachId,
            "firstName lastName",
          );
          if (coach) {
            coachName = `${coach.firstName} ${coach.lastName}`;
          }
        }
        return {
          ...appointment.toObject(),
          coachName,
        };
      }),
    );

    return new Response(JSON.stringify(appointmentsWithCoach), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return errorResponse(error, "Unable to load admin bookings.");
  }
}
