// app/api/auth/student/signup/route.js
import connectToDatabase from "../../../../../Lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import User from "../../../../../models/user";

export async function POST(req) {
  try {
    // Parse the request body
    const { name, email, password, phone, address, coachId } = await req.json();

    // Validate required fields
    if (!name || !email || !phone || !coachId) {
      return new Response(
        JSON.stringify({
          message: "Name, email, phone, and coachId are required.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { db } = await connectToDatabase();

    // Check if the student already exists
    const existingUser = await db.collection("students").findOne({ email });
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "Student already exists." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate and resolve coach ID
    let resolvedCoachId = coachId;
    
    // If coachId is not a valid MongoDB ID (24 chars), treat as username
    if (!ObjectId.isValid(coachId)) {
      const coach = await db.collection("users").findOne({ 
        username: coachId,
        role: 'coach' // Ensure we're getting a coach
      });
      
      if (!coach) {
        return new Response(
          JSON.stringify({ message: "Coach not found with the provided username." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      resolvedCoachId = coach._id.toString();
    } else {
      // Even if it's a valid ObjectId, verify the coach exists
      const coach = await db.collection("users").findOne({ 
        _id: new ObjectId(coachId),
        role: 'coach'
      });
      
      if (!coach) {
        return new Response(
          JSON.stringify({ message: "Coach not found with the provided ID." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new student and return the inserted document
    const result = await db.collection("students").insertOne({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      createdAt: new Date(),
      coachId: resolvedCoachId,
    });

    // Return the complete student data including ID
    const newStudent = {
      _id: result.insertedId,
      name,
      email,
      phone,
      address,
      coachId: resolvedCoachId,
    };

    return new Response(
      JSON.stringify({ message: "Student created successfully." }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(JSON.stringify({ message: "Internal server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
