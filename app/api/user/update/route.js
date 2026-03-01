import { getServerSession } from "next-auth";
import connectToDatabase from "../../../../Lib/mongodb";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import User from "../../../../models/user";

export async function PUT(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
  }

  const { name, contact } = await req.json();
  const updates = {};

  if (typeof name === "string" && name.trim()) {
    updates.name = name.trim().slice(0, 100);
  }

  if (typeof contact === "string" && contact.trim()) {
    updates.contact = contact.trim().slice(0, 200);
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ message: "No valid fields to update." }), { status: 400 });
  }

  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return new Response(JSON.stringify({ message: "User not found." }), { status: 404 });
    }

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          contact: updatedUser.contact,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: "Error updating profile" }), { status: 500 });
  }
}
