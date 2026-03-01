// scripts/createAdmin.js
import bcrypt from "bcryptjs";
import connectToDatabase from "../Lib/mongodb.js";
import Admin from "../models/admin.js";

// Replace these values with the desired admin credentials
const adminEmail = "info@bookmepro.com.au";
const plainPassword = "AdminBpm123@";

async function createAdmin() {
  try {
    // Connect to the database
    await connectToDatabase();

    // Check if the admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create the new admin user
    const newAdmin = await Admin.create({
      email: adminEmail,
      password: hashedPassword,
    });

    console.log("Admin created successfully:", newAdmin);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
