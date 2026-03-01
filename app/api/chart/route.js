// app/api/chart/route.js
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
    // Set the start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Query the database for appointments within the current month
    const appointments = await db.collection('appointments').find({
      coachId,
      selectedDate: { // Assuming the field in your DB is called 'selectedDate'
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).toArray();

    // Initialize an array for all days in the current month
    const daysInMonth = endOfMonth.getDate();
    const counts = new Array(daysInMonth).fill(0);

    // Count appointments for each day
    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.selectedDate);
      const dayIndex = appointmentDate.getDate() - 1; // Get the day index (0-30)
      counts[dayIndex]++;
    });

    return new Response(JSON.stringify({ counts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error("Error fetching appointment counts:", error);
    return new Response(JSON.stringify({ 
      message: "Error fetching appointment statistics.",
      error: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}