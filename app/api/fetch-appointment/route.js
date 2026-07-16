import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import {
  errorResponse,
  requireSession,
} from "../../../Lib/auth/requireSession";
import { normalizeAppointmentStatus } from "../../../Lib/booking/time";

export async function GET() {
  try {
    const session = await requireSession(["student"]);
    const { db } = await connectToDatabase();
    const ids = ObjectId.isValid(session.user.id)
      ? [session.user.id, new ObjectId(session.user.id)]
      : [session.user.id];
    const appointments = await db
      .collection("appointments")
      .find(
        { studentId: { $in: ids } },
        {
          projection: {
            selectedDate: 1,
            selectedTime: 1,
            startAt: 1,
            endAt: 1,
            timeZone: 1,
            status: 1,
            appointmentDetails: 1,
          },
        },
      )
      .sort({ startAt: -1, selectedDate: -1 })
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
