import { NextResponse } from "next/server";
import connectDB from "../../../../Lib/mongodb";
import User from "../../../../models/user";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req) {
  await connectDB();
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 }
      );
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetTokenExpires");

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired password reset token." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    // Skip full document validation to handle accounts that pre-date recent
    // schema changes requiring additional fields.
    await user.save({ validateBeforeSave: false });

    return NextResponse.json(
      { message: "Password reset successful! Redirecting to login..." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
