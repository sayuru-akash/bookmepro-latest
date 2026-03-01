// Lib/mongodb.js
import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config();
const uri = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

export default async function connectToDatabase() {
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  if (!MONGODB_DB) {
    throw new Error("Please define the MONGODB_DB environment variable");
  }

  // Check if Mongoose is already connected
  if (mongoose.connection.readyState >= 1) {
    console.log("Already connected to MongoDB");
    return mongoose.connection;
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(uri, {
      dbName: MONGODB_DB,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw error; // Re-throw the error for upstream handling
  }

  return mongoose.connection;
}
