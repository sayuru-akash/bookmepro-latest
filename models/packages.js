import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["starter", "growth", "pro", "enterprise"],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true,
    },
    // NEW: Add countryCode to specify the region for this price
    countryCode: {
      type: String,
      required: true,
      uppercase: true, // Store country codes consistently (e.g., US, IN, EU, DEFAULT)
    },
    price: {
      type: Number,
      required: true,
    },
    // NEW: Add currency and symbol for Stripe and display
    currency: {
      type: String,
      required: true,
      uppercase: true, // e.g., USD, INR, EUR
    },
    symbol: {
      type: String,
      required: true, // e.g., $, ₹, €
    },
  },
  { timestamps: true }
);

// Update the compound unique index to include the countryCode
packageSchema.index({ plan: 1, billingCycle: 1, countryCode: 1 }, { unique: true });

const Package = mongoose.models.Package || mongoose.model("Package", packageSchema);

export default Package;