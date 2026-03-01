// app/api/create-checkout-session/route.js

import { NextResponse } from "next/server";
import { normalizeCountryCode } from "../../../app/config/pricing";
import { getStripeClient } from "../../../Lib/stripeClient";
import { validate as validateEmail } from "email-validator";

export async function POST(request) {
  try {
    const { name, email, plan, billingCycle, countryCode } =
      await request.json();

    // 1. Validation
    if (!name || !email || !plan || !billingCycle || !countryCode) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }
    const allowedPlans = ["starter", "growth", "pro", "enterprise"];
    const allowedBillingCycles = ["monthly", "quarterly", "yearly"];
    if (!allowedPlans.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selection." },
        { status: 400 },
      );
    }
    if (!allowedBillingCycles.includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle selection." },
        { status: 400 },
      );
    }
    if (plan === "enterprise") {
      return NextResponse.json(
        { error: "Please contact sales for Enterprise plans." },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();

    // 2. Dynamically Construct the Lookup Keys
    const validatedCountryCode = normalizeCountryCode(countryCode);
    const primaryLookupKey =
      `${plan}_${billingCycle}_${validatedCountryCode}`.toLowerCase();
    const fallbackLookupKey = `${plan}_${billingCycle}_default`.toLowerCase();

    let priceId; // store the final price_... ID here

    // 3. Use Stripe to Find the Price, with a Fallback
    try {
      // First, try to retrieve the price for the specific country
      const prices = await stripe.prices.list({
        lookup_keys: [primaryLookupKey],
        limit: 1,
      });
      if (prices.data.length > 0) {
        priceId = prices.data[0].id; // Success! We found the specific price.
      } else {
        // If not found, try the fallback key
        const fallbackPrices = await stripe.prices.list({
          lookup_keys: [fallbackLookupKey],
          limit: 1,
        });
        if (fallbackPrices.data.length > 0) {
          priceId = fallbackPrices.data[0].id; // Success! We found the fallback price.
        }
      }
    } catch (error) {
      console.error("Error fetching prices from Stripe:", error);
      return NextResponse.json(
        { error: "Could not retrieve pricing information." },
        { status: 500 },
      );
    }

    if (!priceId) {
      console.error(
        `FATAL: Pricing not found in Stripe for key=${primaryLookupKey} OR fallback key=${fallbackLookupKey}`,
      );
      return NextResponse.json(
        {
          error: "This pricing plan is not configured. Please contact support.",
        },
        { status: 404 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base URL is not configured." },
        { status: 500 },
      );
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      // Session-level metadata is what checkout.session.completed webhook reads
      metadata: {
        plan: plan,
        billingCycle: billingCycle,
        userEmail: email,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        // Subscription metadata is read by subscription.* webhook events
        metadata: {
          plan: plan,
          billingCycle: billingCycle,
          userEmail: email,
        },
      },
      success_url: `${baseUrl}/auth/payment/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/auth/payment`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
