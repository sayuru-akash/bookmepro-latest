import connectToDatabase from "../../../../Lib/mongodb";
import User from "../../../../models/user";

export async function GET(req) {
  const { db } = await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const coachId = searchParams.get("coachId");

  if (!coachId) {
    return new Response(
      JSON.stringify({ message: "Coach ID is required." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // First get the coach's maxStudents limit
    const coach = await User.findOne({ _id: coachId });
    if (!coach) {
      return new Response(
        JSON.stringify({ message: "Coach not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const maxStudents = coach.maxStudents;

    // Now get the current student count
    let query = { coachId: coachId };
    let appointments = await db
      .collection("appointments")
      .find(query, { projection: { email: 1 } })
      .toArray();

    // Fallback logic
    if (appointments.length === 0) {
      try {
        const { ObjectId } = require("mongodb");
        query = { coachId: new ObjectId(coachId) };
        appointments = await db
          .collection("appointments")
          .find(query, { projection: { email: 1 } })
          .toArray();
      } catch (error) {
        // console.log("Trying alternative field name...");
        query = { coach_id: coachId };
        appointments = await db
          .collection("appointments")
          .find(query, { projection: { email: 1 } })
          .toArray();
      }
    }

    // Calculate unique student count
    const emails = appointments.map(app => app.email).filter(Boolean);
    const uniqueEmails = new Set(emails);
    const studentCount = uniqueEmails.size;

    // Compare with maxStudents
    const hasExceededLimit = studentCount > maxStudents;
    const usagePercentage = Math.round((studentCount / maxStudents) * 100);

    return new Response(
      JSON.stringify({ 
        studentCount,
        maxStudents,
        hasExceededLimit,
        usagePercentage,
        currentPlan: coach.plan,
        message: hasExceededLimit
          ? `You've exceeded your student limit (${studentCount}/${maxStudents}). Please upgrade your plan.`
          : `Current students: ${studentCount}/${maxStudents}`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error checking student limit:", error);
    return new Response(
      JSON.stringify({
        message: "Error checking student limit.",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}