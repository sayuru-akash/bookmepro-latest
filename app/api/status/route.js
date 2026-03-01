// app/api/status/route.js
import connectToDatabase from "../../../Lib/mongodb";

export async function GET(req) {
  const { db } = await connectToDatabase();
  const url = new URL(req.url);
  const coachId = url.searchParams.get("coachId");

  if (!coachId) {
    return new Response(JSON.stringify({ message: "Coach ID is required." }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    // First get all appointments for this coach
    const query = { coachId };

    // Get all appointments by status
    const [approved, declined, pending] = await Promise.all([
      db.collection("appointments").find({ ...query, status: "Approved" }).toArray(),
      db.collection("appointments").find({ ...query, status: "Declined" }).toArray(),
      db.collection("appointments").find({ ...query, status: "pending" }).toArray(),
    ]);

    // Calculate counts and percentages
    const approvedCount = approved.length;
    const declinedCount = declined.length;
    const pendingCount = pending.length;
    const total = approvedCount + declinedCount + pendingCount;

    const response = {
      total,
      approved: {
        count: approvedCount,
        percentage: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
      },
      declined: {
        count: declinedCount,
        percentage: total > 0 ? Math.round((declinedCount / total) * 100) : 0,
      },
      pending: {
        count: pendingCount,
        percentage: total > 0 ? Math.round((pendingCount / total) * 100) : 0,
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error("Error fetching appointment stats:", error);
    return new Response(JSON.stringify({ message: "Error fetching appointment statistics." }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}