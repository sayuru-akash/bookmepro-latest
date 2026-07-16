import { ObjectId } from "mongodb";
import connectToDatabase from "../../../../Lib/mongodb";
import {
  errorResponse,
  requireSession,
} from "../../../../Lib/auth/requireSession";

const projection = {
  password: 0,
  emailVerificationTokenHash: 0,
  emailVerificationExpiresAt: 0,
  resetPasswordToken: 0,
  resetPasswordExpires: 0,
};

async function ownedStudent(studentId) {
  const session = await requireSession(["student", "admin"]);
  if (!ObjectId.isValid(studentId)) {
    const error = new Error("Invalid student ID.");
    error.status = 400;
    throw error;
  }
  if (session.user.role !== "admin" && session.user.id !== studentId) {
    const error = new Error("You do not own this profile.");
    error.status = 403;
    throw error;
  }
  return new ObjectId(studentId);
}

export async function GET(_request, { params }) {
  try {
    const { studentId } = await params;
    const id = await ownedStudent(studentId);
    const { db } = await connectToDatabase();
    const student = await db
      .collection("students")
      .findOne({ _id: id }, { projection });
    if (!student)
      return Response.json({ message: "Student not found." }, { status: 404 });
    return Response.json({ student });
  } catch (error) {
    return errorResponse(error, "Unable to load the student profile.");
  }
}

export async function PUT(request, { params }) {
  try {
    const { studentId } = await params;
    const id = await ownedStudent(studentId);
    const body = await request.json();
    const fullName = String(body.fullName || body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    if (!fullName || !phone) {
      return Response.json(
        { message: "Full name and phone are required." },
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const student = await db
      .collection("students")
      .findOneAndUpdate(
        { _id: id },
        {
          $set: {
            name: fullName,
            fullName,
            phone,
            address,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after", projection },
      );
    if (!student)
      return Response.json({ message: "Student not found." }, { status: 404 });
    return Response.json({ message: "Profile updated successfully.", student });
  } catch (error) {
    return errorResponse(error, "Unable to update the student profile.");
  }
}
