// app/api/admin/coaches/route.js
import connectToDatabase from "../../../../Lib/mongodb";
import { NextResponse } from "next/server";
import User from "../../../../models/user";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const coaches = await User.find({ role: "coach" }).select(
      "-password -__v -createdAt -updatedAt"
    );

    return NextResponse.json(coaches);
  } catch (error) {
    console.error("Failed to fetch coaches:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
