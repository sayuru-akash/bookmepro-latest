// app/api/admin/students/[id]/route.js
import connectToDatabase from "../../../../../Lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  try {
    const studentId = params.id;
    const { name, email, phone, address } = await request.json();
    const { db } = await connectToDatabase();

    // Update the student
    const updateResult = await db
      .collection("students")
      .updateOne(
        { _id: new ObjectId(studentId) },
        { $set: { name, email, phone, address } }
      );

    if (updateResult.matchedCount === 0) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch the updated student
    const updatedStudent = await db.collection("students").findOne({
      _id: new ObjectId(studentId),
    });

    if (!updatedStudent) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { password, ...studentWithoutPassword } = updatedStudent;
    return new Response(JSON.stringify(studentWithoutPassword), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const studentId = params.id;
    const { db } = await connectToDatabase();
    const result = await db
      .collection("students")
      .deleteOne({ _id: new ObjectId(studentId) });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ message: "Student not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Student deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error deleting student:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
