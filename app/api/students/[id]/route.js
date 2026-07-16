import { ObjectId } from "mongodb";
import connectToDatabase from "../../../../Lib/mongodb";
import {
  errorResponse,
  requireSession,
} from "../../../../Lib/auth/requireSession";

export async function GET(_request, { params }) {
  try {
    const session = await requireSession(["student", "admin"]);
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ message: "Invalid student ID." }, { status: 400 });
    }
    if (session.user.role !== "admin" && session.user.id !== id) {
      return Response.json(
        { message: "You do not own this profile." },
        { status: 403 },
      );
    }
    const { db } = await connectToDatabase();
    const student = await db.collection("students").findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          password: 0,
          emailVerificationTokenHash: 0,
          emailVerificationExpiresAt: 0,
          resetPasswordToken: 0,
          resetPasswordExpires: 0,
        },
      },
    );
    if (!student)
      return Response.json({ message: "Student not found." }, { status: 404 });
    return Response.json(student);
  } catch (error) {
    return errorResponse(error, "Unable to load the student profile.");
  }
}
