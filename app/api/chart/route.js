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
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const coachIds = ObjectId.isValid(session.user.id)
      ? [session.user.id, new ObjectId(session.user.id)]
      : [session.user.id];
    const grouped = await db
      .collection("appointments")
      .aggregate([
        {
          $match: {
            coachId: { $in: coachIds },
            selectedDate: { $gte: start, $lt: end },
          },
        },
        {
          $group: { _id: { $dayOfMonth: "$selectedDate" }, count: { $sum: 1 } },
        },
      ])
      .toArray();
    const counts = new Array(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    ).fill(0);
    for (const item of grouped) counts[item._id - 1] = item.count;
    return Response.json({ counts });
  } catch (error) {
    return errorResponse(error, "Unable to load the booking chart.");
  }
}
