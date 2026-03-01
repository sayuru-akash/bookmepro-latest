import connectToDatabase from "../../../Lib/mongodb"; // Adjust the path
import { ObjectId } from "mongodb"; // Adjust based on your actual database connection utility

// Utility function to fetch coachId from username
const getCoachIdFromUsername = async (username, db) => {
  const coach = await db.collection('coaches').findOne({ username: username });
  return coach ? coach._id : null; // Adjust this based on your database structure
};

export async function GET(req) {
  const { db } = await connectToDatabase(); // Database connection
  const { searchParams } = new URL(req.url);

  // Extract query parameter for username
  const username = searchParams.get("username");

  // Ensure username is provided
  if (!username) {
    return new Response(JSON.stringify({ error: "Username is required" }), {
      status: 400,
    });
  }

  try {
    // Get coachId from username
    const coachId = await getCoachIdFromUsername(username, db);

    if (coachId) {
      // Return the coachId as a JSON response
      return new Response(JSON.stringify({ coachId }), {
        status: 200,
      });
    } else {
      // Handle case where the username is not found
      return new Response(JSON.stringify({ error: "Coach not found" }), {
        status: 404,
      });
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
