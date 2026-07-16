import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: "Student",
    },
    coachId: { type: mongoose.Schema.Types.Mixed, required: true, ref: "User" },
    name: { type: String, default: "" },
    fullName: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    appointmentDetails: { type: String, default: "" },
    selectedDate: { type: Date, required: true },
    selectedTime: { type: String, required: true },
    selectedTimezone: { type: String, default: "Australia/Sydney" },
    timeZone: { type: String, default: "Australia/Sydney" },
    startAt: { type: Date, index: true },
    endAt: { type: Date },
    location: { type: String, default: null },
    isIndividualSession: { type: Boolean, default: true },
    multipleBookings: { type: Boolean, default: false },
    capacity: { type: Number, min: 1, max: 500, default: 1 },
    groupKey: { type: String, index: true },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "declined",
        "cancelled",
        "completed",
        "no_show",
      ],
      default: "pending",
      index: true,
    },
    version: { type: Number, default: 1 },
    idempotencyKey: { type: String },
    reservationReleased: { type: Boolean, default: false },
    externalCalendarEventId: { type: String, default: null },
    externalCalendarHtmlLink: { type: String, default: null },
    googleMeetLink: { type: String, default: null },
    calendarSyncedAt: { type: Date, default: null },
    calendarSyncError: { type: String, default: null },
    reminderSchedule: { type: [mongoose.Schema.Types.Mixed], default: [] },
    statusEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true, strict: true },
);

AppointmentSchema.index(
  { idempotencyKey: 1 },
  { unique: true, sparse: true, name: "booking_idempotency" },
);
AppointmentSchema.index(
  { coachId: 1, startAt: 1, endAt: 1, status: 1 },
  { name: "booking_conflicts" },
);
AppointmentSchema.index(
  { studentId: 1, startAt: 1, status: 1 },
  { name: "student_schedule" },
);

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);

export default Appointment;
