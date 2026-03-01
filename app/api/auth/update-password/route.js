// app/api/auth/update-password/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "../../../../Lib/mongodb"; // Adjust the path as necessary
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { email, oldPassword, newPassword } = await req.json();

        // Validate input
        if (!email || !oldPassword || !newPassword) {
            return NextResponse.json({ message: "All fields are required." }, { status: 400 });
        }

        const { db } = await connectToDatabase();

        // Check if the user exists
        const user = await db.collection("users").findOne({ email });
        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: "Old password is incorrect." }, { status: 401 });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        await db.collection("users").updateOne(
            { email },
            { $set: { password: hashedNewPassword } }
        );

        return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}