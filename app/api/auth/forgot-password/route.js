import { NextResponse } from "next/server.js";
import connectDB from "../../../../Lib/mongodb.js";
import User from "../../../../models/user.js";
import crypto from "crypto";
import { sendEmail } from "../../../../utils/sendEmail.js";

export async function POST(req) {
  await connectDB();
  try {
    const { email } = await req.json();

    const user = await User.findOne({ email });

    if (!user) {
      // Security best practice: don't reveal if a user exists.
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const passwordResetTokenExpires = Date.now() + 3600000;

    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;
    // Skip full document validation to avoid issues with legacy users that may
    // be missing newly required fields.
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

    const emailResult = await sendEmail({
      email: user.email,
      name: user.firstName || user.email,
      subject: "Password Reset Request",
      htmlContent: `<p>You are receiving this email because you (or someone else) has requested to reset the password for your account.</p>
             <p>Please click the following link to complete the process within one hour:</p>
             <a href="${resetUrl}" target="_blank" rel="noopener noreferrer">${resetUrl}</a>
             <p>If you did not request this, please ignore this email.</p>`,
    });

    if (!emailResult.success) {
      console.error(
        "Error sending password reset email:",
        emailResult.error
      );
      return NextResponse.json(
        { message: "Failed to send password reset email." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
