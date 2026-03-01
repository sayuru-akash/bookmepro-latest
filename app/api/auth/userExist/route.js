// app/api/auth/userExist/route.js
import connectToDatabase from "../../../../Lib/mongodb";

// /api/auth/userExist/route.js

export async function POST(req) {
  const { email } = await req.json(); // Parse the incoming JSON body

  // Validate the email
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if the user exists in your database
  const userExists = await checkUserInDatabase(email); // Replace with your actual database check

  return new Response(JSON.stringify({ exists: userExists }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Example function to check user existence in the database
async function checkUserInDatabase(email) {
  // Replace this with your database logic
  const users = ['test@example.com', 'user@example.com']; // Example user list
  return users.includes(email);
}