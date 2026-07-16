import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import validator from "validator";
import { ObjectId } from "mongodb";
import connectToDatabase from "../../../../../Lib/mongodb";
import { sendStudentVerificationEmail } from "../../../../../Lib/notifications/accountEmail";

function strongPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    [/[a-z]/, /[A-Z]/, /\d/, /[@$!%*?&#]/].filter((rule) => rule.test(value))
      .length >= 3
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "").trim();
    if (
      !name ||
      !validator.isEmail(email) ||
      !phone ||
      !body.coachId ||
      !strongPassword(body.password)
    ) {
      return Response.json(
        {
          message:
            "Provide a valid name, email, phone, coach, and strong password.",
        },
        { status: 400 },
      );
    }
    const connection = await connectToDatabase();
    const db = connection.db;
    const coach = ObjectId.isValid(body.coachId)
      ? await db
          .collection("users")
          .findOne({ _id: new ObjectId(body.coachId), role: "coach" })
      : await db
          .collection("users")
          .findOne({ username: body.coachId, role: "coach" });
    if (!coach)
      return Response.json({ message: "Coach not found." }, { status: 404 });
    if (await db.collection("students").findOne({ email })) {
      return Response.json(
        { message: "A student account already exists for this email." },
        { status: 409 },
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("base64url");
    const verificationHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const now = new Date();
    const result = await db.collection("students").insertOne({
      name,
      fullName: name,
      email,
      password: await bcrypt.hash(body.password, 12),
      phone,
      address: String(body.address || "").trim(),
      coachId: String(coach._id),
      role: "student",
      emailVerifiedAt: null,
      emailVerificationTokenHash: verificationHash,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      emailVerificationSentAt: now,
      createdAt: now,
      updatedAt: now,
    });
    try {
      await sendStudentVerificationEmail({
        email,
        name,
        token: verificationToken,
      });
    } catch (error) {
      await db.collection("students").deleteOne({ _id: result.insertedId });
      throw new Error(`Verification email could not be sent: ${error.message}`);
    }
    return Response.json(
      {
        message:
          "Student created successfully. Check your email to verify the account.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Student signup failed:", error);
    if (error?.code === 11000) {
      return Response.json(
        { message: "A student account already exists for this email." },
        { status: 409 },
      );
    }
    return Response.json(
      { message: "Unable to create the student account." },
      { status: 500 },
    );
  }
}
