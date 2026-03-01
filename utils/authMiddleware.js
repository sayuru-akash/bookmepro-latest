import jwt from "jsonwebtoken";
import { getSession } from "next-auth/react"; // Or other session management you are using
import { jwtVerify } from 'jose'

// Example middleware to check token and authorization
export async function verifyTokenAndAuthorization(req, res, next) {
  try {
    // Get the token from the request (either from headers or cookies)
    const token = req.headers["authorization"]?.split(" ")[1]; // "Bearer <token>"
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Decode the token to get user data
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key for JWT decoding

    // Check if the user is authorized (you can check the decoded info)
    if (decoded.id !== req.query.userId) {
      return res.status(403).json({ message: "You are not authorized to access this resource" });
    }

    // If everything checks out, pass control to the next handler
    next();
  } catch (err) {
    console.error("Authorization error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
