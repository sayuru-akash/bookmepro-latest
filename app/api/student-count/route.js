import connectToDatabase from "../../../Lib/mongodb";

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
    // console.log("Searching for coach ID:", coachId);
    
    let actualCoachId = coachId;
    
    // First, check if coachId is a username and get the actual ObjectId
    const { ObjectId } = require("mongodb");
    if (!ObjectId.isValid(coachId)) {
      // console.log("Not a valid ObjectId, looking up coach by username...");
      
      // Look up coach by username to get the actual ObjectId
      const coach = await db
        .collection("users") 
        .findOne({ username: coachId });
      
      if (coach) {
        actualCoachId = coach._id.toString();
        // console.log("Found coach ObjectId:", actualCoachId);
      } else {
        // console.log("Coach not found with username:", coachId);
        return new Response(
          JSON.stringify({ studentCount: 0 }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    // Now search for appointments using the actual coach ObjectId
    let query = { coachId: actualCoachId };
    let appointments = await db
      .collection("appointments")
      .find(query, { projection: { email: 1 } })
      .toArray();

    // Fallback: try with ObjectId format
    if (appointments.length === 0) {
      try {
        query = { coachId: new ObjectId(actualCoachId) };
        appointments = await db
          .collection("appointments")
          .find(query, { projection: { email: 1 } })
          .toArray();
      } catch (error) {
        // console.log("Error with ObjectId conversion, trying alternative field name...");
        // Try with an alternative field name if stored as 'coach_id'
        query = { coach_id: actualCoachId };
        appointments = await db
          .collection("appointments")
          .find(query, { projection: { email: 1 } })
          .toArray();
      }
    }

    // Extract the email addresses and filter out any invalid values
    const emails = appointments.map(app => app.email).filter(Boolean);
    
    // Use a Set to ensure only unique emails are counted
    const uniqueEmails = new Set(emails);
    const studentCount = uniqueEmails.size;

    // console.log("Unique email count:", studentCount);
    
    return new Response(
      JSON.stringify({ studentCount }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching student count:", error);
    return new Response(
      JSON.stringify({
        message: "Error fetching student count.",
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


// import connectToDatabase from "../../../Lib/mongodb";

// export async function GET(req) {
//   const { db } = await connectToDatabase();
//   const { searchParams } = new URL(req.url);
//   const coachId = searchParams.get("coachId");

//   if (!coachId) {
//     return new Response(
//       JSON.stringify({ message: "Coach ID is required." }),
//       { status: 400, headers: { "Content-Type": "application/json" } }
//     );
//   }

//   try {
//     // console.log("Searching for coach ID:", coachId);
//     let query = { coachId: coachId };

//     // Select only the email field from the appointments collection
//     let appointments = await db
//       .collection("appointments")
//       .find(query, { projection: { email: 1 } })
//       .toArray();

//     // Fallback: if no appointments are found, try converting coachId to ObjectId
//     if (appointments.length === 0) {
//       try {
//         const { ObjectId } = require("mongodb");
//         query = { coachId: new ObjectId(coachId) };
//         appointments = await db
//           .collection("appointments")
//           .find(query, { projection: { email: 1 } })
//           .toArray();
//       } catch (error) {
//         // console.log("Not a valid ObjectId, trying alternative field name...");
//         // Try with an alternative field name if stored as 'coach_id'
//         query = { coach_id: coachId };
//         appointments = await db
//           .collection("appointments")
//           .find(query, { projection: { email: 1 } })
//           .toArray();
//       }
//     }

//     // Extract the email addresses and filter out any invalid values
//     const emails = appointments.map(app => app.email).filter(Boolean);
    
//     // Use a Set to ensure only unique emails are counted
//     const uniqueEmails = new Set(emails);
//     const studentCount = uniqueEmails.size;

//     // console.log("Unique email count:", studentCount);
    
//     return new Response(
//       JSON.stringify({ studentCount }),
//       { status: 200, headers: { "Content-Type": "application/json" } }
//     );
//   } catch (error) {
//     console.error("Error fetching student count:", error);
//     return new Response(
//       JSON.stringify({
//         message: "Error fetching student count.",
//         error: error.message,
//       }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// }


