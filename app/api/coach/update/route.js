// app/api/coach/update/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import connectToDatabase from "../../../../Lib/mongodb";
import { v2 as cloudinary } from "cloudinary";
import { Buffer } from "buffer";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_GALLERY_IMAGES = 5;

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await connectToDatabase();
  const userEmail = session.user.email;

  try {
    const formData = await req.formData();

    // Find existing user first so fields can fall back to DB values if needed
    const existingUser = await db
      .collection("users")
      .findOne({ email: userEmail });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log the form data being received
    for (let [key, value] of formData.entries()) {
      // console.log(key, value);
    }

    // Extracting form fields
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const location = formData.get("location") || null;
    // Allow empty string to clear the videoLink; fall back to existing only if field wasn’t sent at all
    const videoLinkRaw = formData.get("videoLink");
    const videoLink =
      videoLinkRaw !== null
        ? videoLinkRaw || null
        : existingUser.videoLink || null;
    const description = formData.get("description") || null;
    const hourlyRateRaw = formData.get("hourlyRate");
    const hourlyRate =
      hourlyRateRaw && hourlyRateRaw.trim() !== ""
        ? parseFloat(hourlyRateRaw)
        : null;
    const displayEmail = formData.get("displayEmail") || null;
    const displayContact = formData.get("displayContact") || null;
    const timezone =
      formData.get("timezone") || existingUser.timezone || "Australia/Sydney";
    let existingGallery = JSON.parse(formData.get("existingGallery") || "[]");
    const newGalleryImages = formData.getAll("gallery");

    // If the user doesn't have a username, generate one
    let username = formData.get("username");
    if (!username) {
      if (!firstName || !lastName) {
        return NextResponse.json(
          {
            error:
              "First name and last name are required to generate a username.",
          },
          { status: 400 },
        );
      }

      // Generate unique username
      username = await generateUniqueUsername(db, firstName, lastName);
      // console.log("Generated username:", username);
    }

    const updateData = {
      firstName,
      lastName,
      username,
      location,
      description,
      hourlyRate,
      displayEmail,
      displayContact,
      videoLink: videoLink || null,
      timezone,
    };

    // Handle profile photo upload
    const profilePhoto = formData.get("profilePhoto");
    if (profilePhoto && profilePhoto.name) {
      const photoBuffer = Buffer.from(await profilePhoto.arrayBuffer());
      const uploadResponse = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${photoBuffer.toString("base64")}`,
        {
          folder: "profile-images",
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: 80 },
          ],
        },
      );
      updateData.profilePhoto = uploadResponse.secure_url;
    }

    // Handle gallery images
    if (newGalleryImages.length + existingGallery.length > MAX_GALLERY_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_GALLERY_IMAGES} gallery images allowed` },
        { status: 400 },
      );
    }

    // Initialize gallery with existing images
    updateData.gallery = [...existingGallery];

    if (newGalleryImages.length > 0) {
      for (const image of newGalleryImages) {
        if (image && image.name) {
          const imageBuffer = Buffer.from(await image.arrayBuffer());
          const uploadResponse = await cloudinary.uploader.upload(
            `data:image/jpeg;base64,${imageBuffer.toString("base64")}`,
            {
              folder: "gallery-images",
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: 80 },
              ],
            },
          );
          updateData.gallery.push(uploadResponse.secure_url);
        }
      }
    }

    // Log the update data before saving
    // console.log("Update data to be saved:", updateData);

    // Update user in database
    const result = await db
      .collection("users")
      .updateOne({ email: userEmail }, { $set: updateData });

    // Log the result of the update
    // console.log("Database update result:", result);

    // modifiedCount can be 0 when the submitted data is identical to what’s already in the DB.
    // That is still a successful operation — return 200.
    return NextResponse.json(
      { message: "Profile updated successfully", gallery: updateData.gallery },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again later." },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 },
    );
  }

  try {
    const { db } = await connectToDatabase();

    // Log the username being checked
    // console.log("Checking username availability:", username);

    // Check database if username exists
    const existingUser = await db.collection("users").findOne({ username });

    // Log the result of the query
    // console.log("Existing user:", existingUser);

    return NextResponse.json({
      available: !existingUser,
    });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { error: "Username check failed" },
      { status: 500 },
    );
  }
}
