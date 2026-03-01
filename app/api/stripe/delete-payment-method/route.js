// app/api/stripe/delete-payment-method/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import dbconnect from "../../../../Lib/mongodb";
import User from "../../../../models/user";
import { getStripeClient } from "../../../../Lib/stripeClient";

export async function POST(req) {
  // Parse request body
  const { paymentMethodId } = await req.json();

  // Authenticate user session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const stripe = getStripeClient();

    // Detach the payment method in Stripe
    await stripe.paymentMethods.detach(paymentMethodId);
    // console.log("Payment method detached successfully");

    // Ensure DB connection
    await dbconnect();

    // Fetch user to get subscription ID
    const user = await User.findById(userId);
    if (!user?.stripeSubscriptionId) {
      console.warn(
        `[delete-payment-method] User ${userId} has no subscription ID`
      );
    } else {
      // Cancel the Stripe subscription immediately
      await stripe.subscriptions.del(user.stripeSubscriptionId);
      // console.log(`Subscription ${user.stripeSubscriptionId} canceled`);
    }

    // Calculate deactivate date (30 days from now)
    const detachedDate = new Date();
    const deactivateAt = new Date(detachedDate);
    deactivateAt.setDate(deactivateAt.getDate() + 30);

    // Update the user's payment status, detached date and deactivateAt
    await User.findByIdAndUpdate(userId, {
      paymentStatus: "inactive",
      detachedDate,
      deactivateAt,
    });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[delete-payment-method] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
