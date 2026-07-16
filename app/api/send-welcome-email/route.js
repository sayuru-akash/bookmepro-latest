import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import {
  errorResponse,
  requireSession,
} from "../../../Lib/auth/requireSession";
import { escapeHtml, sendBrevoEmail } from "../../../Lib/notifications/email";

export async function POST() {
  try {
    const session = await requireSession(["coach"]);
    const { db } = await connectToDatabase();
    const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
    const user = await db.collection("users").findOneAndUpdate(
      {
        _id: new ObjectId(session.user.id),
        role: "coach",
        paymentStatus: { $in: ["active", "trialing"] },
        welcomeEmailSentAt: { $exists: false },
        $or: [
          { welcomeEmailSendingAt: { $exists: false } },
          { welcomeEmailSendingAt: { $lt: staleBefore } },
        ],
      },
      { $set: { welcomeEmailSendingAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!user) {
      return Response.json({ message: "Welcome email already handled." });
    }
    const name = user.name || user.firstName || "Coach";
    const plan = user.plan || "BookMePro";
    try {
      await sendBrevoEmail({
        to: { email: user.email, name },
        subject: "Welcome to BookMePro — your subscription is active",
        htmlContent: `<h1>Welcome to BookMePro, ${escapeHtml(name)}!</h1><p>Your ${escapeHtml(plan)} plan is active.</p><p>Complete your profile, publish availability, connect Google Calendar, and share your coach profile to start receiving bookings.</p><p><a href="https://bookmepro.com.au/dashboard">Go to your dashboard</a></p>`,
        textContent: `Welcome to BookMePro, ${name}. Your ${plan} plan is active. Visit https://bookmepro.com.au/dashboard`,
        tags: ["bookmepro", "welcome"],
        idempotencyKey: `welcome:${user._id}:${plan}`,
      });
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          {
            $set: { welcomeEmailSentAt: new Date() },
            $unset: { welcomeEmailSendingAt: "" },
          },
        );
      return Response.json({ message: "Welcome email sent successfully." });
    } catch (error) {
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $unset: { welcomeEmailSendingAt: "" } },
        );
      throw error;
    }
  } catch (error) {
    return errorResponse(error, "Unable to send the welcome email.");
  }
}
