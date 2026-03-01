//app/api/stripe/get-payment-methods/route.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../Lib/auth/nextauth-options";
import { NextResponse } from "next/server";
import connectToDatabase from "../../../../Lib/mongodb";
import { getStripeClient } from "../../../../Lib/stripeClient";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET() {
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
      return NextResponse.json({ paymentMethods: [] });
    }

    // Fetch payment methods from Stripe
    const stripe = getStripeClient();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    return NextResponse.json({ 
      paymentMethods: paymentMethods.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
