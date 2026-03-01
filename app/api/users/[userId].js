import { getSession } from "next-auth/react";
import User from "../../../models/user"; // Your User model (adjust the path accordingly)

export default async function handler(req, res) {

  const { method, query: { userId } } = req;

  // Check if the user is authenticated (optional, depending on your requirements)
  const session = await getSession({ req });
  

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" }); // If no session, return 401
  }

  try {
    if (method === "GET") {
      // Fetch the user from MongoDB using the userId
      const user = await User.findById(userId); // Assuming you're using the _id field in MongoDB

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Respond with the user data
      return res.status(200).json(user);
    } else {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
}
