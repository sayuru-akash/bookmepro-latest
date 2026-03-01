// app/api/admin/students/route.js
import connectToDatabase from "../../../../Lib/mongodb";

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const students = await db.collection("students").find({}).toArray();
    // Remove sensitive data (password) from each student document
    const sanitizedStudents = students.map(({ password, ...rest }) => rest);
    return new Response(JSON.stringify(sanitizedStudents), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
