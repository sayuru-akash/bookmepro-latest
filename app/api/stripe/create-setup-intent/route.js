// app/api/stripe/create-setup-intent/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import { NextResponse } from "next/server";
import connectToDatabase from "../../../../Lib/mongodb";
import { getStripeClient } from "../../../../Lib/stripeClient";

export async function POST() {
  try {
    // Retrieve the session using getServerSession
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Find the user in your database
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    // Create a Stripe setup intent
    const stripe = getStripeClient();
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      payment_method_types: ["card"],
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Error creating setup intent:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
