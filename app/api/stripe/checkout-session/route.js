import { NextResponse } from "next/server";
import connectToDatabase from "../../../../Lib/mongodb";
import Package from "../../../../models/packages";
import { getStripeClient } from "../../../../Lib/stripeClient";

export async function POST(req) {
  try {
    const { planName, cycle, countryCode } = await req.json();

    // --- 1. Connect to Database and Securely Look Up Price ---
    await connectToDatabase();

    let pkg = await Package.findOne({
      plan: planName,
      billingCycle: cycle,
      countryCode: countryCode.toUpperCase(),
    }).lean();

    // Fallback to DEFAULT if a country-specific price isn't found
    if (!pkg) {
      pkg = await Package.findOne({
        plan: planName,
        billingCycle: cycle,
        countryCode: "DEFAULT",
      }).lean();
    }

    // If still not found after fallback, it's an error.
    if (!pkg) {
      return NextResponse.json(
        { error: "Pricing for this plan and region is not available." },
        { status: 400 }
      );
    }

    const { price: amount, currency, symbol } = pkg;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // --- 2. Create Stripe Checkout Session (logic is the same as before) ---
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: Math.round(amount * 100), // Convert to smallest unit (cents/paise)
            product_data: {
              name: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
              description: `Billed ${cycle}`,
            },
            recurring: {
              interval:
                cycle === "yearly"
                  ? "year"
                  : cycle === "quarterly"
                    ? "month"
                    : "month",
              interval_count: cycle === "quarterly" ? 3 : 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/auth/payment/payment-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(name)}&plan=${encodeURIComponent(plan)}&email=${encodeURIComponent(email)}`,
      cancel_url: `${baseUrl}/auth/payment`,
      metadata: {
        planName: planName,
        billingCycle: cycle,
        countryCode: countryCode,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
