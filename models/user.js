// models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: "" },
    contact: { type: String, required: true },
    profilePhoto: {
      type: String,
      default: "/images/coach/defaultprofile.jpg",
    },
    gallery: { type: [String], default: [] },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    username: { type: String, unique: true, sparse: true },
    usernameSet: { type: Boolean, default: false },
    location: { type: String, default: "" },
    description: { type: String, default: "" },
    videoLink: { type: String, default: "" },
    hourlyRate: { type: Number, default: 0 },
    displayEmail: { type: String, default: "" },
    displayContact: { type: String, default: "" },
    role: {
      type: String,
      default: "coach",
      required: true,
    },
    plan: {
      type: String,
      enum: ["starter", "growth", "pro", "enterprise"],
      default: "starter",
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },
    countryCode: {
      type: String,
      trim: true, // Removes any leading/trailing whitespace
      uppercase: true, // Stores the code as 'US', not 'us'
    },
    maxStudents: { type: Number, required: true, default: 25 },
    nextResetDate: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ["trialing", "active", "inactive", "canceled", "past_due"],
      default: "inactive",
      required: true,
    },
    timezone: { type: String, default: "Australia/Sydney" },
    passwordResetToken: { type: String },
    passwordResetTokenExpires: { type: Date },
    stripeCustomerId: { type: String, unique: true, sparse: true },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    currentPeriodEnd: { type: Date },
    trialEnd: { type: Date },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
