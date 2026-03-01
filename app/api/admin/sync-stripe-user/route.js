// app/api/admin/sync-stripe-user/route.js
// Admin-only endpoint to manually sync a user's Stripe subscription status.
// Use this when a user has paid but their dashboard still shows "Subscription Inactive"
// (e.g. caused by a missed / failed webhook event).
//
// Usage:  POST /api/admin/sync-stripe-user
//   Body: { "email": "user@example.com" }
//    OR
//   Body: { "stripeCustomerId": "cus_xxxxxxx" }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import connectToDatabase from "../../../../Lib/mongodb";
import User from "../../../../models/user";
import { getStripeClient } from "../../../../Lib/stripeClient";

export const dynamic = "force-dynamic";

export async function POST(request) {
  // Only admins may call this endpoint
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { email, stripeCustomerId } = body;

  if (!email && !stripeCustomerId) {
    return NextResponse.json(
      { error: "Provide either email or stripeCustomerId." },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const stripe = getStripeClient();

    // 1. Find the user in MongoDB
    const query = email ? { email: email.toLowerCase() } : { stripeCustomerId };

    const dbUser = await User.findOne(query);
    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in database." },
        { status: 404 },
      );
    }

    // 2. Resolve Stripe customer ID
    let customerId = dbUser.stripeCustomerId || stripeCustomerId;

    if (!customerId) {
      // Look up by email directly in Stripe
      const customers = await stripe.customers.list({
        email: dbUser.email,
        limit: 1,
      });
      if (!customers.data.length) {
        return NextResponse.json(
          { error: `No Stripe customer found for email ${dbUser.email}.` },
          { status: 404 },
        );
      }
      customerId = customers.data[0].id;
    }

    // 3. Get the latest active/trialing subscription for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 5,
      status: "all",
    });

    if (!subscriptions.data.length) {
      return NextResponse.json(
        {
          error: `No subscriptions found in Stripe for customer ${customerId}.`,
        },
        { status: 404 },
      );
    }

    // Prefer active > trialing > any other
    const priority = ["active", "trialing", "past_due", "unpaid", "canceled"];
    const subscription = subscriptions.data.sort(
      (a, b) => priority.indexOf(a.status) - priority.indexOf(b.status),
    )[0];

    // 4. Build the update payload
    const planName =
      subscription.metadata?.plan ||
      subscription.items.data[0]?.price?.metadata?.plan ||
      null;
    const billingCycle = subscription.metadata?.billingCycle || null;

    const updateData = {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      paymentStatus: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    };
    if (planName) updateData.plan = planName;
    if (billingCycle) updateData.billingCycle = billingCycle;

    // 5. Persist the synced data
    const updatedUser = await User.findOneAndUpdate(
      { _id: dbUser._id },
      { $set: updateData },
      { new: true },
    );

    return NextResponse.json({
      success: true,
      message: `User ${dbUser.email} synced from Stripe successfully.`,
      syncedStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      currentPeriodEnd: updateData.currentPeriodEnd,
      plan: updatedUser.plan,
      billingCycle: updatedUser.billingCycle,
    });
  } catch (error) {
    console.error("Error in sync-stripe-user:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
