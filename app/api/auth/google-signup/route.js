import connectToDatabase from "../../../../Lib/mongodb";
import { NextResponse } from "next/server";
import { validate } from "email-validator";
import User from "../../../../models/user";
import Package from "../../../../models/packages";
import { PRICING_PLANS, normalizeCountryCode } from "../../../config/pricing";
import { getStripeClient } from "../../../../Lib/stripeClient";

/**
 * Gets the maximum number of students allowed for a given plan.
 * @param {string} plan - The name of the subscription plan.
 * @returns {number} The maximum number of students.
 */
function getMaxStudents(plan) {
  const plans = { starter: 25, growth: 50, pro: 100, enterprise: 10000 };
  return plans[plan.toLowerCase()] || 25;
}

/**
 * Retrieves pricing information by checking the database and falling back to a static config.
 * @param {string} plan - The subscription plan name.
 * @param {string} billingCycle - The billing cycle (e.g., 'monthly').
 * @param {string} countryCode - The user's country code.
 * @returns {Promise<{price: number, currency: string}>} The price and currency.
 */
async function getPricingInfo(plan, billingCycle, countryCode) {
  // First, look for a country-specific pricing package in the database
  let pkg = await Package.findOne({
    plan,
    billingCycle,
    countryCode: countryCode.toUpperCase(),
  }).lean();

  // If not found, fall back to the default pricing package in the database
  if (!pkg) {
    pkg = await Package.findOne({
      plan,
      billingCycle,
      countryCode: "DEFAULT",
    }).lean();
  }

  // If still not found in the DB, use the static pricing configuration as a final fallback
  if (!pkg) {
    const normalized = normalizeCountryCode(countryCode);
    const planConfig = PRICING_PLANS[plan];
    if (planConfig) {
      const pricing = planConfig.prices[normalized] || planConfig.prices.DEFAULT;
      pkg = {
        price: pricing[billingCycle],
        currency: pricing.currency,
      };
    }
  }

  // If no pricing can be determined, throw an error
  if (!pkg || typeof pkg.price === 'undefined' || !pkg.currency) {
    throw new Error(`Pricing could not be determined for plan: ${plan}, cycle: ${billingCycle}, country: ${countryCode}`);
  }

  return { price: pkg.price, currency: pkg.currency };
}


export async function POST(req) {
  try {
    await connectToDatabase();
    const { firstName, lastName, email, plan, billingCycle, countryCode } = await req.json();

    // --- 1. Validate Input ---
    if (!firstName || !email || !plan || !billingCycle || !countryCode) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }
    if (!validate(email)) {
      return NextResponse.json({ message: "Invalid email format." }, { status: 400 });
    }

    // --- 2. Find or Create User ---
    let user = await User.findOne({ email });

    if (!user) {
      // If the user doesn't exist, create a new one.
      user = await User.create({
        firstName,
        lastName: lastName || "",
        email,
        plan: plan.toLowerCase(),
        billingCycle,
        countryCode,
        maxStudents: getMaxStudents(plan),
        role: "coach",
        paymentStatus: "inactive",
        isOAuthUser: true,
        oauthProvider: "google",
        createdAt: new Date(),
        updatedAt: new Date(),
        nextResetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      });
    }

    // --- 3. Get Pricing Information ---
    const { price: amount, currency } = await getPricingInfo(plan, billingCycle, countryCode);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // --- 4. Create Stripe Checkout Session ---
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount * 100), // Price in the smallest currency unit (e.g., cents)
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
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
        trial_period_days: 30, // Provide a 30-day free trial
      },
      success_url: `${baseUrl}/auth/payment/payment-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(user.firstName)}&plan=${plan}`,
      cancel_url: `${baseUrl}/auth/payment`, // Redirect here if the user cancels
      metadata: {
        userId: user._id.toString(),
        userEmail: email,
        planName: plan,
        billingCycle,
        countryCode,
      },
    });

    // --- 5. Save the session ID on the user's record for future reference ---
    await User.findByIdAndUpdate(user._id, { stripeSessionId: session.id });

    // --- 6. Return the Checkout URL to the Frontend ---
    return NextResponse.json(
      {
        message: "User processing complete. Redirecting to payment.",
        checkoutUrl: session.url,
      },
      { status: 200 } // Use 200 OK as this handles both new and existing users
    );
  } catch (error) {
    console.error("Error during Google signup and checkout creation:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Internal Server Error", error: errorMessage }, { status: 500 });
  }
}
