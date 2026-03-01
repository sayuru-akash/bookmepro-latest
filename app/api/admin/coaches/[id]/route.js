// app/api/admin/coaches/[id]/route.js
import connectToDatabase from "../../../../../Lib/mongodb";
import { NextResponse } from "next/server";
import User from "../../../../../models/user";
import bcrypt from "bcryptjs";
import { validate } from "email-validator";

export const dynamic = 'force-dynamic';

// Shared functions
function getMaxStudents(plan) {
  const plans = {
    starter: 25,
    growth: 50,
    pro: 100,
    enterprise: 10000,
  };
  return plans[plan.toLowerCase()] || 25;
}

function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return {
    valid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar,
    message: `Password must be at least ${minLength} characters long with uppercase, lowercase, number, and special character.`,
  };
}

// PUT handler - Update coach
export async function PUT(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    const existingCoach = await User.findById(id);
    if (!existingCoach || existingCoach.role !== "coach") {
      return NextResponse.json({ message: "Coach not found" }, { status: 404 });
    }

    // Email validation
    if (body.email && body.email !== existingCoach.email) {
      if (!validate(body.email)) {
        return NextResponse.json({ message: "Invalid email" }, { status: 400 });
      }
      if (await User.findOne({ email: body.email, _id: { $ne: id } })) {
        return NextResponse.json({ message: "Email exists" }, { status: 409 });
      }
    }

    // Password handling
    if (body.password) {
      const pwValidation = validatePassword(body.password);
      if (!pwValidation.valid) {
        return NextResponse.json(
          { message: pwValidation.message },
          { status: 400 }
        );
      }
      body.password = await bcrypt.hash(body.password, 10);
    }

    // Plan update
    if (body.plan) body.maxStudents = getMaxStudents(body.plan);

    const updatedCoach = await User.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    ).select("-password -__v");

    return NextResponse.json(updatedCoach);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE handler - Remove coach
export async function DELETE(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const coach = await User.findById(id);
    if (!coach || coach.role !== "coach") {
      return NextResponse.json({ message: "Coach not found" }, { status: 404 });
    }

    if (coach.paymentStatus === "active") {
      return NextResponse.json(
        { message: "Cannot delete active coach" },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "Coach deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
