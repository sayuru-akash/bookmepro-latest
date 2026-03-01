import connectToDatabase from "../../../Lib/mongodb";
import Student from "../../../models/student";

export async function PUT(req) {
  try {
    // Parse the request body
    const body = await req.json();
    // console.log("Received body:", body);

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
    const studentId = url.pathname.split("/").pop();

    // Connect to the database
    await connectToDatabase();

    // Find the student by ID and update their profile
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { fullName, phone, address },
      { new: true }
    );

    if (!updatedStudent) {
      return new Response(JSON.stringify({ message: "Student not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
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
    return new Response(JSON.stringify({ message: "Internal server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
