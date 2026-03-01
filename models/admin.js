// models/admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

// Explicitly set the collection name to "admins"
const Admin =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema, "admins");
export default Admin;
