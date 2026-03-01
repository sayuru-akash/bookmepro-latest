//app/api/check-payment-status/route.js
import { NextResponse } from "next/server";
import { getStripeClient } from "../../../Lib/stripeClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "A session_id is required to check payment status." },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripeClient();
    // to get its status without a second API call.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    // a one-time payment or failed to create a subscription.
    if (!session?.subscription) {
      // We can return the checkout session's payment status as a fallback.
      return NextResponse.json({ status: session.payment_status });
    }

    // This will be 'trialing', 'active', 'incomplete', 'past_due', etc.
    return NextResponse.json({
      status: session.subscription.status,
      payment_status: session.payment_status, // Also return the raw payment status
    });
  } catch (error) {
    console.error("Error retrieving Stripe session:", error.message);

    // 5. Send a generic error response to the client for security.
    // The specific error is logged on the server for debugging.
    return NextResponse.json(
      { error: "An error occurred while checking payment status." },
      { status: 500 }
    );
  }
}
