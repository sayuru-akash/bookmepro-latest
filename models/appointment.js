//models/appointment.js
import mongoose from "mongoose";

// Define the Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  }, // Reference to the Student model
  coachId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  appointmentDetails: { type: String, required: true },
  selectedDate: { type: Date, required: true },
  selectedTime: { type: String, required: true },
  isIndividualSession: { type: Boolean, required: true },
  // status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
  status: { type: String, required: true },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Compound index used by the duplicate-booking check query.
// location is included because same time at a different location is a valid
// independent booking — only the exact same (student+coach+date+time+location)
// is treated as a duplicate.
// Not marked unique so that declined/cancelled slots can be re-booked.
AppointmentSchema.index(
  {
    studentId: 1,
    coachId: 1,
    selectedDate: 1,
    selectedTime: 1,
    location: 1,
  },
  { name: "idx_booking_dedup" },
);

// Create and export the Appointment model
const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);
export default Appointment;
