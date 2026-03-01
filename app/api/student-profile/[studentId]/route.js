import connectToDatabase from "../../../../Lib/mongodb";
import { ObjectId } from "mongodb";
import Student from "../../../../models/student"; 

export async function GET(req, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { studentId } = params;
    
    // console.log("Raw studentId from params:", studentId);
    
    // Verify collection exists
    const collections = await db.listCollections().toArray();
    // console.log("Available collections:", collections.map(c => c.name));

    let objectId;
    try {
      objectId = new ObjectId(studentId);
      // console.log("Converted to ObjectId:", objectId);
    } catch (error) {
      console.error("Invalid ObjectId conversion:", error);
      return Response.json({ message: "Invalid student ID format" }, { status: 400 });
    }

    const student = await db.collection("students").findOne({ _id: objectId });
    // console.log("Query result:", student);

    if (!student) {
      return Response.json({ message: "Student not found" }, { status: 404 });
    }

    return Response.json({ student });
  } catch (error) {
    console.error("GET error:", error);
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}


export async function PUT(req) {
    try {
      // Parse the request body
      const body = await req.json();
      // console.log("Received body:", body); // Debugging line
  
      // Destructure the required fields from the parsed body
      const { fullName, phone, address } = body;
      // console.log("Extracted values:", fullName, phone, address);
  
      // Validate required fields
      if (!fullName || !phone) {
        console.error("Missing required fields:", { fullName, phone });
        return new Response(
          JSON.stringify({ message: "Full name and phone are required." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
  
      // Extract the student ID from the URL
      const url = new URL(req.url);
      const studentId = url.pathname.split("/").pop(); // Extract the ID from the URL
  
      // Connect to the database
      await connectToDatabase();
  
      // Find the student by ID and update their profile
      const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        { fullName, phone, address },
        { new: true } // Return the updated document
      );
  
      if (!updatedStudent) {
        return new Response(
          JSON.stringify({ message: "Student not found." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
  
      // Return success response
      return new Response(
        JSON.stringify({
          message: "Profile updated successfully.",
          student: updatedStudent,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating student profile:", error);
      return new Response(
        JSON.stringify({ message: "Internal server error." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }