import connectToDatabase from "../../../../Lib/mongodb";
import { NextResponse } from "next/server";
import { validate } from "email-validator";
import User from "../../../../models/user";
import Package from "../../../../models/packages";
import { PRICING_PLANS, normalizeCountryCode } from "../../../config/pricing";
import { getStripeClient } from "../../../../Lib/stripeClient";
import {
  errorResponse,
  requireSession,
} from "../../../../Lib/auth/requireSession";

const ALLOWED_PLANS = ["starter", "growth", "pro", "enterprise"];
const ALLOWED_BILLING_CYCLES = ["monthly", "quarterly", "yearly"];

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
    const session = await requireSession(["coach"]);
    const { firstName, lastName, email, plan, billingCycle, countryCode } =
      await req.json();

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPlan = plan?.trim().toLowerCase();
    const normalizedBillingCycle = billingCycle?.trim().toLowerCase();
    const normalizedCountryCode = normalizeCountryCode(countryCode);

    // --- 1. Validate Input ---
    if (
      !firstName?.trim() ||
      !normalizedEmail ||
      !normalizedPlan ||
      !normalizedBillingCycle ||
      !countryCode
    ) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }
    if (!validate(normalizedEmail)) {
      return NextResponse.json({ message: "Invalid email format." }, { status: 400 });
    }
    if (session.user.email?.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { message: "The signed-in account does not match this checkout." },
        { status: 403 },
      );
    }
    if (!ALLOWED_PLANS.includes(normalizedPlan)) {
      return NextResponse.json({ message: "Invalid plan selection." }, { status: 400 });
    }
    if (!ALLOWED_BILLING_CYCLES.includes(normalizedBillingCycle)) {
      return NextResponse.json(
        { message: "Invalid billing cycle selection." },
        { status: 400 },
      );
    }

    // Google sign-in creates the canonical coach record. Never allow this
    // checkout endpoint to create an account from an untrusted email payload.
    await connectToDatabase();
    const user = await User.findOne({
      _id: session.user.id,
      email: normalizedEmail,
      role: "coach",
    });
    if (!user) {
      return NextResponse.json({ message: "Coach account not found." }, { status: 404 });
    }

    // --- 3. Get Pricing Information ---
    const { price: amount, currency } = await getPricingInfo(
      normalizedPlan,
      normalizedBillingCycle,
      normalizedCountryCode,
    );
    const baseUrl = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL
    )?.replace(/\/$/, "");
    if (!baseUrl) {
      throw new Error("Base URL is not configured");
    }

    // --- 4. Create Stripe Checkout Session ---
    const stripe = getStripeClient();
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      ...(user.stripeCustomerId
        ? { customer: user.stripeCustomerId }
        : { customer_email: normalizedEmail }),
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount * 100), // Price in the smallest currency unit (e.g., cents)
            product_data: {
              name: `${normalizedPlan.charAt(0).toUpperCase() + normalizedPlan.slice(1)} Plan`,
              description: `Billed ${normalizedBillingCycle}`,
            },
            recurring: {
              interval:
                normalizedBillingCycle === "yearly" ? "year" : "month",
              interval_count: normalizedBillingCycle === "quarterly" ? 3 : 1,
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30, // Provide a 30-day free trial
        metadata: {
          plan: normalizedPlan,
          billingCycle: normalizedBillingCycle,
          userEmail: normalizedEmail,
          userId: user._id.toString(),
        },
      },
      success_url: `${baseUrl}/auth/payment/payment-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(user.firstName)}&plan=${normalizedPlan}`,
      cancel_url: `${baseUrl}/auth/payment`, // Redirect here if the user cancels
      metadata: {
        userId: user._id.toString(),
        userEmail: normalizedEmail,
        plan: normalizedPlan,
        billingCycle: normalizedBillingCycle,
        countryCode: normalizedCountryCode,
      },
    });

    // --- 5. Save the session ID on the user's record for future reference ---
    await User.findByIdAndUpdate(user._id, {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      plan: normalizedPlan,
      billingCycle: normalizedBillingCycle,
      countryCode: normalizedCountryCode,
      maxStudents: getMaxStudents(normalizedPlan),
      stripeSessionId: stripeSession.id,
    });

    // --- 6. Return the Checkout URL to the Frontend ---
    return NextResponse.json(
      {
        message: "User processing complete. Redirecting to payment.",
        checkoutUrl: stripeSession.url,
      },
      { status: 200 } // Use 200 OK as this handles both new and existing users
    );
  } catch (error) {
    if (!error?.status || error.status >= 500) {
      console.error("Error during Google signup and checkout creation:", error);
    }
    return errorResponse(error, "Unable to start Google checkout.");
  }
}
