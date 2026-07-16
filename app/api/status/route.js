import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import {
  errorResponse,
  requireSession,
} from "../../../Lib/auth/requireSession";

export async function GET() {
  try {
    const session = await requireSession(["coach"]);
    const { db } = await connectToDatabase();
    const coachIds = ObjectId.isValid(session.user.id)
      ? [session.user.id, new ObjectId(session.user.id)]
      : [session.user.id];
    const counts = await db
      .collection("appointments")
      .aggregate([
        { $match: { coachId: { $in: coachIds } } },
        { $set: { normalizedStatus: { $toLower: "$status" } } },
        { $group: { _id: "$normalizedStatus", count: { $sum: 1 } } },
      ])
      .toArray();
    const count = Object.fromEntries(
      counts.map((item) => [item._id, item.count]),
    );
    const total =
      (count.approved || 0) + (count.declined || 0) + (count.pending || 0);
    const value = (status) => ({
      count: count[status] || 0,
      percentage: total ? Math.round(((count[status] || 0) / total) * 100) : 0,
    });
    return Response.json({
      total,
      approved: value("approved"),
      declined: value("declined"),
      pending: value("pending"),
    });
  } catch (error) {
    return errorResponse(error, "Unable to load booking statistics.");
  }
}
