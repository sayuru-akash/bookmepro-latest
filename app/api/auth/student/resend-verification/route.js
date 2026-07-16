import crypto from "node:crypto";
import validator from "validator";
import connectToDatabase from "../../../../../Lib/mongodb";
import { sendStudentVerificationEmail } from "../../../../../Lib/notifications/accountEmail";

const GENERIC_MESSAGE =
  "If an unverified student account exists, a new verification email has been sent.";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    if (!validator.isEmail(email)) {
      return Response.json(
        { message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const connection = await connectToDatabase();
    const db = connection.db;
    const verificationToken = crypto.randomBytes(32).toString("base64url");
    const verificationHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const now = new Date();
    const cooldownBefore = new Date(now.getTime() - 60_000);
    const student = await db.collection("students").findOneAndUpdate(
      {
        email,
        emailVerifiedAt: null,
        $or: [
          { emailVerificationSentAt: { $exists: false } },
          { emailVerificationSentAt: { $lte: cooldownBefore } },
        ],
      },
      {
        $set: {
          emailVerificationTokenHash: verificationHash,
          emailVerificationExpiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ),
          emailVerificationSentAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );

    if (student) {
      await sendStudentVerificationEmail({
        email: student.email,
        name: student.name || student.fullName,
        token: verificationToken,
      });
    }
    return Response.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Student verification resend failed:", error);
    return Response.json(
      { message: "Unable to resend verification right now." },
      { status: 502 },
    );
  }
}
