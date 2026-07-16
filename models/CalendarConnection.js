import mongoose from "mongoose";

const watchChannelSchema = new mongoose.Schema(
  {
    calendarId: { type: String, required: true },
    channelId: { type: String, required: true },
    resourceId: { type: String, required: true },
    token: { type: String, required: true },
    expiration: { type: Date, required: true },
  },
  { _id: false },
);

const calendarConnectionSchema = new mongoose.Schema(
  {
    ownerType: { type: String, enum: ["coach", "student"], required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    googleEmail: { type: String, default: "" },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true },
    scopes: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["connected", "needs_reauth", "disconnected", "error"],
      default: "connected",
    },
    busyCalendarIds: { type: [String], default: ["primary"] },
    destinationCalendarId: { type: String, default: "primary" },
    createGoogleMeet: { type: Boolean, default: false },
    addPendingHolds: { type: Boolean, default: true },
    calendarTimeZone: { type: String, default: "Australia/Sydney" },
    syncToken: { type: String, default: null },
    lastSyncedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    watchChannels: { type: [watchChannelSchema], default: [] },
  },
  { timestamps: true },
);

calendarConnectionSchema.index(
  { ownerType: 1, ownerId: 1 },
  { unique: true, name: "calendar_owner_unique" },
);
calendarConnectionSchema.index(
  { "watchChannels.channelId": 1 },
  { sparse: true, name: "calendar_watch_channel" },
);

const CalendarConnection =
  mongoose.models.CalendarConnection ||
  mongoose.model("CalendarConnection", calendarConnectionSchema);

export default CalendarConnection;
