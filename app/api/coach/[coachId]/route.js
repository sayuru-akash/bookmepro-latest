// app/api/coach/[coachId]/route.js
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import connectToDatabase from "../../../../Lib/mongodb";
import User from "../../../../models/user";

export async function GET(req, { params }) {
  const { coachId } = await params;

  try {
    await connectToDatabase();

    // Check if the coachId is a valid ObjectId (MongoDB ID)
    const isObjectId = ObjectId.isValid(coachId);

    let coach;

    if (isObjectId) {
      coach = await User.findOne({ _id: coachId }).lean();
    } else {
      coach = await User.findOne({ username: coachId }).lean();
    }

    // If coach is not found, return a 404 error
    if (!coach) {
      return new Response("Coach not found", { status: 404 });
    }

    // Structure the response data
    const coachData = {
      id: coach._id.toString(),
      firstName: coach.firstName,
      lastName: coach.lastName,
      email: coach.email,
      username: coach.username,
      description: coach.description,
      hourlyRate: coach.hourlyRate,
      displayEmail: coach.displayEmail,
      displayContact: coach.displayContact,
      billingCycle: coach.billingCycle,
      location: coach.location,
      contact: coach.contact,
      image: coach.profilePhoto || "/images/coach/defaultprofile.jpg",
      gallery: coach.gallery || ["/images/coach/defaultprofile.jpg"],
      role: coach.role,
      plan: coach.plan,
      maxStudents: coach.maxStudents,
      paymentStatus: coach.paymentStatus,
      videoLink: coach.videoLink,
      timezone: coach.timezone || "Australia/Sydney",
    };

    // console.log({ coachData });

    return new Response(JSON.stringify(coachData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching coach:", error);
    return new Response("An error occurred while fetching the coach", {
      status: 500,
    });
  }
}

// PATCH /api/coach/[coachId] — update individual profile fields (JSON body)
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { coachId } = await params;

  // Only allow coaches to update their own record
  if (session.user.id !== coachId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  try {
    const body = await req.json();

    // Whitelist the fields that are allowed to be patched this way
    const allowed = ["timezone"];
    const updateFields = {};
    for (const key of allowed) {
      if (key in body) updateFields[key] = body[key];
    }

    if (Object.keys(updateFields).length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid fields to update." }),
        { status: 400 },
      );
    }

    // Use Mongoose directly (consistent with GET, avoids raw-driver issues)
    await connectToDatabase();
    const updated = await User.findByIdAndUpdate(
      coachId,
      { $set: updateFields },
      { new: true },
    );

    if (!updated) {
      return new Response(JSON.stringify({ error: "Coach not found." }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Updated successfully.", ...updateFields }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error patching coach:", error);
    return new Response(JSON.stringify({ error: "Failed to update." }), {
      status: 500,
    });
  }
}
