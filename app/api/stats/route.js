import connectToDatabase from "../../../Lib/mongodb"; 
import { NextResponse } from "next/server";

// Utility function to check if the provided date is valid
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export async function GET(req) {
  const { db } = await connectToDatabase();
  const { searchParams } = new URL(req.url);
  
  // Extract query parameters
  const coachId = searchParams.get("coachId");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const allTime = searchParams.get("allTime") === "true";
  
  // Ensure coachId is provided
  if (!coachId) {
    return new Response(
      JSON.stringify({ message: "coachId is required." }),
      { status: 400 }
    );
  }

  // Initialize the query object with coachId
  const query = { coachId };

  try {
    // Handle allTime filter
    if (allTime) {
      delete query.selectedDate; // Remove selectedDate filter if allTime is true
    } else if (fromDate && toDate) {
      // Validate date format for fromDate and toDate
      if (!isValidDate(fromDate) || !isValidDate(toDate)) {
        return NextResponse.json(
          { message: "Invalid date format provided." },
          { status: 400 }
        );
      }
      // Add selectedDate filter for a specific date range
      query.selectedDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    } else {
      // Default to today's date if no fromDate or toDate provided
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0); // Start of today (midnight)
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999); // End of today (one millisecond before midnight)

      query.selectedDate = {
        $gte: startOfToday,
        $lte: endOfToday,
      };
    }

    // Fetch the appointments from the database
    const appointments = await db
      .collection("appointments")
      .find(query)
      .toArray();

    // Return the fetched appointments as JSON
    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response("An error occurred while fetching data", {
      status: 500,
    });
  }
}
