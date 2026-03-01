//app/api/users/[userId]/route.js
import { verifyTokenAndAuthorization } from "../../../../Lib/auth/verifyToken";
import { ObjectId } from "mongodb";
import dbConnect from "../../../../Lib/mongodb"; 
import User from "../../../../models/user";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const isAuthorized = await verifyTokenAndAuthorization(request);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database.
    await dbConnect();

    const { userId } = params; 
    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    // Fetch the user data based on userId.
    const user = await User.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Return user data if found.
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}