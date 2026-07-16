// models/student.js
import mongoose from "mongoose";

// Define the Student Schema
const StudentSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  fullName: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String }, // Optional field
  coachId: { type: String, required: true },
  role: { type: String, default: "student" }, // Default role
  emailVerifiedAt: { type: Date, default: null },
  emailVerificationTokenHash: { type: String, default: null },
  emailVerificationExpiresAt: { type: Date, default: null },
  emailVerificationSentAt: { type: Date, default: null },
  timezone: { type: String, default: "Australia/Sydney" },
  createdAt: { type: Date, default: Date.now }, // Auto-generated timestamp
});

// Create and export the Student model
const Student =
  mongoose.models.Student || mongoose.model("Student", StudentSchema);
export default Student;
