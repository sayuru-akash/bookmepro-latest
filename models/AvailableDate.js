// models/AvailableDate.js
import { model, Schema } from "mongoose";
import mongoose from "mongoose";

const availableDateSchema = new Schema({
  date: { type: Date, required: true },
  slots: { type: Number, required: true },
  // timezone: { type: String, required: true },
  timeSlots: [
    {
      time: { type: String, required: true },
      multipleBookings: { type: Boolean, default: false },
      timezone: { type: String, required: true },
      location: { type: String },
    },
  ],
  coachId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
});

// Create a composite unique index on coachId and date.
// This ensures that each coach can have only one entry per date.
availableDateSchema.index({ coachId: 1, date: 1 }, { unique: true });

const AvailableDate =
  mongoose.models.AvailableDate || model("AvailableDate", availableDateSchema);
export default AvailableDate;
