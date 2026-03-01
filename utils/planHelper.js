// utils/planHelper.js
import Plan from "../models/Plan";

export const getPlanByClientCount = async (clientCount) => {
  try {
    const plan = await Plan.findOne({
      minClients: { $lte: clientCount },
      maxClients: { $gte: clientCount },
    });
    if (!plan) {
      throw new Error("No matching plan found for the given client count.");
    }
    return plan;
  } catch (error) {
    console.error("Error fetching plan:", error);
    throw error;
  }
};