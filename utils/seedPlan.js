// utils/seedPlan.js
import mongoose from "mongoose";
import Plan from "../models/Plan";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedPlans = async () => {
  try {
    await connectDB();

    for (const plan of PLANS) {
      const existingPlan = await Plan.findOne({ name: plan.name });
      if (!existingPlan) {
        await Plan.create(plan);
        console.log(`Plan ${plan.name} created.`);
      }
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding plans:", error);
  }
};

const PLANS = [
  { name: "Starter", minClients: 1, maxClients: 25, price: 1000 }, // $10.00
  { name: "Growth", minClients: 26, maxClients: 50, price: 1500 }, // $15.00
  { name: "Pro", minClients: 51, maxClients: 100, price: 2000 }, // $20.00
  { name: "Enterprise", minClients: 101, maxClients: Infinity, price: 2500 }, // $25.00
];

seedPlans();