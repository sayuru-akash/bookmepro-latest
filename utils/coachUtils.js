import { ObjectId } from "mongodb";
import connectToDatabase from "../Lib/mongodb"; // Adjust based on your project structure

export async function resolveCoachId(identifier) {
  // If it's already a valid MongoDB ObjectId, return it as is
  if (ObjectId.isValid(identifier)) {
    return identifier;
  }

  // Otherwise, resolve it as a username
  const { db } = await connectToDatabase();
  const coach = await db.collection("coaches").findOne({ username: identifier });

  return coach ? coach._id.toString() : null;
}
