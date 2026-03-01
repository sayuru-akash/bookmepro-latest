// app/api/stripe/create-upgrade-session/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "../../../../Lib/mongodb";
import User from "../../../../models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import { PRICING_PLANS, normalizeCountryCode } from "../../../config/pricing";
import Package from "../../../../models/packages";
import { getStripeClient } from "../../../../Lib/stripeClient";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { planName, billingCycle, countryCode } = await req.json();

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let pkg = await Package.findOne({
      plan: planName,
      billingCycle: billingCycle,
      countryCode: countryCode.toUpperCase(),
    }).lean();

    if (!pkg) {
      const normalized = normalizeCountryCode(countryCode);
      const planInfo = PRICING_PLANS[planName];
      const pricing = planInfo.prices[normalized] || planInfo.prices.DEFAULT;
      pkg = {
        price: pricing[billingCycle],
        currency: pricing.currency,
      };
    }

    if (!pkg) {
      return NextResponse.json(
        { error: "Pricing for this plan is not available." },
        { status: 400 }
      );
    }

    const { price: amount, currency } = pkg;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const stripe = getStripeClient();
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: user.stripeCustomerId, // Use existing customer
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan`,
              description: `Billed ${billingCycle}`,
            },
            recurring: {
              interval: billingCycle === "yearly" ? "year" : "month",
              interval_count: billingCycle === "quarterly" ? 3 : 1,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          plan: planName,
          billingCycle: billingCycle,
          userId: user._id.toString(),
        },
      },
      success_url: `${baseUrl}/dashboard?upgrade=success`,
      cancel_url: `${baseUrl}/dashboard/upgrade-plan?upgrade=cancelled`,
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Stripe upgrade session creation failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
