// app/api/auth/signup/route.js
import connectToDatabase from "../../../../Lib/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { validate } from "email-validator";
import User from "../../../../models/user";
import Package from "../../../../models/packages";
import { PRICING_PLANS, normalizeCountryCode } from "../../../config/pricing";
import { getStripeClient } from "../../../../Lib/stripeClient";

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

    if (
      !firstName ||
      !email ||
      !password ||
      !contact ||
      !plan ||
      !billingCycle ||
      !countryCode
    ) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      );
    }
    if (!validate(email)) {
      return NextResponse.json(
        { message: "Invalid email format." },
        { status: 400 }
      );
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { message: passwordValidation.message },
        { status: 400 }
      );
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const maxStudents = getMaxStudents(plan);
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1);

    const newUser = await User.create({
      firstName,
      lastName: lastName || "",
      email,
      password: hashedPassword,
      contact,
      plan: plan.toLowerCase(),
      billingCycle,
      countryCode,
      maxStudents,
      role: "coach",
      paymentStatus: "inactive",
      createdAt: new Date(),
      updatedAt: new Date(),
      nextResetDate,
    });

    let pkg = await Package.findOne({
      plan: plan,
      billingCycle: billingCycle,
      countryCode: countryCode.toUpperCase(),
    }).lean();

    if (!pkg) {
      pkg = await Package.findOne({
        plan: plan,
        billingCycle: billingCycle,
        countryCode: "DEFAULT",
      }).lean();
    } // Fallback to static pricing config if no package found in DB

    if (!pkg) {
      const normalized = normalizeCountryCode(countryCode);
      const planInfo = PRICING_PLANS[plan];
      if (planInfo) {
        const pricing = planInfo.prices[normalized] || planInfo.prices.DEFAULT;
        pkg = {
          plan,
          billingCycle,
          countryCode: normalized,
          price: pricing[billingCycle],
          currency: pricing.currency,
          symbol: pricing.symbol,
        };
      }
    }

    if (!pkg) {
      // Fallback to static pricing configuration when DB entry is missing
      const normalized = normalizeCountryCode(countryCode);
      const planConfig = PRICING_PLANS[plan];
      if (planConfig) {
        const pricing =
          planConfig.prices[normalized] || planConfig.prices.DEFAULT;
        pkg = {
          plan,
          billingCycle,
          countryCode: normalized,
          price: pricing[billingCycle],
          currency: pricing.currency,
          symbol: pricing.symbol,
        };
      } else {
        console.error(
          `Pricing not found for plan: ${plan}, cycle: ${billingCycle}, country: ${countryCode}`
        );
        return NextResponse.json(
          {
            message:
              "Pricing for this plan is not available. Your account was created, but please contact support to complete payment.",
          },
          { status: 500 }
        );
      }
    }

    const { price: amount, currency } = pkg;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: Math.round(amount * 100),
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
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30,
      },
      success_url: `${baseUrl}/auth/payment/payment-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(firstName)}&plan=${encodeURIComponent(plan)}&email=${encodeURIComponent(email)}`,
      cancel_url: `${baseUrl}/auth/payment`,
      metadata: {
        userId: newUser._id.toString(),
        userEmail: email, // Add this line
        planName: plan,
        billingCycle: billingCycle,
        countryCode: countryCode,
      },
    }); // Save session ID on user for later reference

    await User.findByIdAndUpdate(newUser._id, { stripeSessionId: session.id });

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
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
