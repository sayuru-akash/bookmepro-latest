import crypto from "node:crypto";
import connectToDatabase from "../../../../../Lib/mongodb";

export async function POST(request) {
  const { token } = await request.json();
  if (!token)
    return Response.json(
      { message: "Verification token is required." },
      { status: 400 },
    );
  const connection = await connectToDatabase();
  const hash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const student = await connection.db.collection("students").findOneAndUpdate(
    {
      emailVerificationTokenHash: hash,
      emailVerificationExpiresAt: { $gt: new Date() },
    },
    {
      $set: { emailVerifiedAt: new Date(), updatedAt: new Date() },
      $unset: {
        emailVerificationTokenHash: "",
        emailVerificationExpiresAt: "",
      },
    },
    { returnDocument: "after" },
  );
  if (!student)
    return Response.json(
      { message: "This verification link is invalid or expired." },
      { status: 400 },
    );
  return Response.json({
    message: "Email verified. You can now sign in and book sessions.",
  });
}
