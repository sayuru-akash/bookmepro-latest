// app/api/students/[id]/route.js
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);

  try {
    const { id: studentId } = await params;
    const student = await db.collection("students").findOne({
      _id: new ObjectId(studentId),
    });

    if (!student) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
      });
    }

    // Remove sensitive data like password
    const { password, ...studentData } = student;
    return new Response(JSON.stringify(studentData), { status: 200 });
  } catch (error) {
    console.error("Error fetching student:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
    });
  } finally {
    await client.close();
  }
}
