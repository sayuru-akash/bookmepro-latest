// app/api/auth/signup/route.js
import connectToDatabase from "../../../../Lib/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validate } from "email-validator";
import User from "../../../../models/user";
import Package from "../../../../models/packages";
import { PRICING_PLANS, normalizeCountryCode } from "../../../config/pricing";
import { getStripeClient } from "../../../../Lib/stripeClient";

const ALLOWED_PLANS = ["starter", "growth", "pro", "enterprise"];
const ALLOWED_BILLING_CYCLES = ["monthly", "quarterly", "yearly"];

function getMaxStudents(plan) {
  const plans = { starter: 25, growth: 50, pro: 100, enterprise: 10000 };
  return plans[plan.toLowerCase()] || 25;
}

function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return {
    valid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar,
    message: `Password must be at least ${minLength} characters long and contain uppercase, lowercase, number, and special characters.`,
  };
}

export async function POST(req) {
  let createdUserId = null;
  let checkoutSessionCreated = false;

  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      password,
      contact,
      plan,
      billingCycle,
      countryCode,
    } = body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPlan = plan?.trim().toLowerCase();
    const normalizedBillingCycle = billingCycle?.trim().toLowerCase();
    const normalizedCountryCode = normalizeCountryCode(countryCode);

    if (
      !firstName?.trim() ||
      !normalizedEmail ||
      !password ||
      !contact?.trim() ||
      !normalizedPlan ||
      !normalizedBillingCycle ||
      !countryCode
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }
    if (!validate(normalizedEmail)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }
    if (!ALLOWED_PLANS.includes(normalizedPlan)) {
      return NextResponse.json(
        { message: "Invalid plan selection." },
        { status: 400 },
      );
    }
    if (!ALLOWED_BILLING_CYCLES.includes(normalizedBillingCycle)) {
      return NextResponse.json(
        { message: "Invalid billing cycle selection." },
        { status: 400 },
      );
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { message: passwordValidation.message },
        { status: 400 }
      );
    }
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const maxStudents = getMaxStudents(normalizedPlan);
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    const newUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      email: normalizedEmail,
      password: hashedPassword,
      contact: contact.trim(),
      plan: normalizedPlan,
      billingCycle: normalizedBillingCycle,
      countryCode: normalizedCountryCode,
      maxStudents,
      role: "coach",
      paymentStatus: "inactive",
      createdAt: new Date(),
      updatedAt: new Date(),
      nextResetDate,
    });
    createdUserId = newUser._id;

    let pkg = await Package.findOne({
      plan: normalizedPlan,
      billingCycle: normalizedBillingCycle,
      countryCode: normalizedCountryCode,
    }).lean();

    if (!pkg) {
      pkg = await Package.findOne({
        plan: normalizedPlan,
        billingCycle: normalizedBillingCycle,
        countryCode: "DEFAULT",
      }).lean();
    } // Fallback to static pricing config if no package found in DB

    if (!pkg) {
      const normalized = normalizedCountryCode;
      const planInfo = PRICING_PLANS[normalizedPlan];
      if (planInfo) {
        const pricing = planInfo.prices[normalized] || planInfo.prices.DEFAULT;
        pkg = {
          plan: normalizedPlan,
          billingCycle: normalizedBillingCycle,
          countryCode: normalized,
          price: pricing[normalizedBillingCycle],
          currency: pricing.currency,
          symbol: pricing.symbol,
        };
      }
    }

    if (!pkg || !Number.isFinite(Number(pkg.price)) || !pkg.currency) {
      throw new Error("Pricing is not configured for the selected plan");
    }

    const { price: amount, currency } = pkg;
    const baseUrl = (
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXTAUTH_URL
    )?.replace(/\/$/, "");
    if (!baseUrl) {
      throw new Error("Base URL is not configured");
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: normalizedEmail,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount * 100),
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
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          plan: normalizedPlan,
          billingCycle: normalizedBillingCycle,
          userEmail: normalizedEmail,
          userId: newUser._id.toString(),
        },
      },
      success_url: `${baseUrl}/auth/payment/payment-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(firstName.trim())}&plan=${encodeURIComponent(normalizedPlan)}&email=${encodeURIComponent(normalizedEmail)}`,
      cancel_url: `${baseUrl}/auth/payment`,
      metadata: {
        userId: newUser._id.toString(),
        userEmail: normalizedEmail,
        plan: normalizedPlan,
        billingCycle: normalizedBillingCycle,
        countryCode: normalizedCountryCode,
      },
    });
    checkoutSessionCreated = true;

    try {
      await User.findByIdAndUpdate(newUser._id, {
        stripeSessionId: session.id,
      });
    } catch (updateError) {
      console.error("Failed to save Stripe session ID:", updateError);
    }
    return NextResponse.json(
      {
        message: "User created successfully",
        userId: newUser._id,
        checkoutUrl: session.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during signup and checkout creation:", error);
    if (createdUserId && !checkoutSessionCreated) {
      try {
        await User.deleteOne({
          _id: createdUserId,
          paymentStatus: "inactive",
          stripeCustomerId: { $exists: false },
        });
      } catch (cleanupError) {
        console.error("Failed to clean up incomplete signup:", cleanupError);
      }
    }
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
