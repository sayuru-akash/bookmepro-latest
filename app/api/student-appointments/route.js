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
    const studentIds = ObjectId.isValid(session.user.id)
      ? [session.user.id, new ObjectId(session.user.id)]
      : [session.user.id];
    const appointments = await db
      .collection("appointments")
      .aggregate([
        { $match: { studentId: { $in: studentIds } } },
        {
          $lookup: {
            from: "users",
            let: { coachId: "$coachId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [{ $toString: "$_id" }, { $toString: "$$coachId" }],
                  },
                },
              },
              {
                $project: {
                  password: 0,
                  resetPasswordToken: 0,
                  resetPasswordExpires: 0,
                  stripeCustomerId: 0,
                },
              },
            ],
            as: "coach",
          },
        },
        { $set: { coach: { $first: "$coach" } } },
        { $sort: { startAt: -1, selectedDate: -1 } },
        { $limit: 1000 },
      ])
      .toArray();

    return Response.json(
      appointments.map((appointment) => ({
        ...appointment,
        status: normalizeAppointmentStatus(appointment.status),
        coach: appointment.coach
          ? {
              ...appointment.coach,
              profileUrl: appointment.coach.username
                ? `/coach/${appointment.coach.username}`
                : `/coach/${appointment.coach._id}`,
            }
          : null,
      })),
    );
  } catch (error) {
    return errorResponse(error, "Unable to load student appointments.");
  }
}
