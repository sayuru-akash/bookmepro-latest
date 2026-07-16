import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import {
  errorResponse,
  requireSession,
} from "../../../Lib/auth/requireSession";

export async function GET(request) {
  try {
    const session = await requireSession(["coach"]);
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const coachIds = ObjectId.isValid(session.user.id)
      ? [session.user.id, new ObjectId(session.user.id)]
      : [session.user.id];
    const query = { coachId: { $in: coachIds } };
    if (searchParams.get("allTime") !== "true") {
      if (searchParams.get("fromDate") && searchParams.get("toDate")) {
        const start = new Date(searchParams.get("fromDate"));
        const end = new Date(searchParams.get("toDate"));
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return Response.json(
            { message: "Invalid date range." },
            { status: 400 },
          );
        }
        query.selectedDate = { $gte: start, $lte: end };
      } else {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        query.selectedDate = { $gte: start, $lte: end };
      }
    }
    const appointments = await db
      .collection("appointments")
      .find(query, { projection: { _id: 1 } })
      .limit(10000)
      .toArray();
    return Response.json({ appointments, count: appointments.length });
  } catch (error) {
    return errorResponse(error, "Unable to load booking totals.");
  }
}
