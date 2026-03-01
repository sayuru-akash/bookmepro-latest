import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minClients: { type: Number, required: true },
  maxClients: { type: Number, required: true },
  price: { type: Number, required: true }, // Price stored in cents
});

// Prevent model recompilation - fixed schema name variable
const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plan;