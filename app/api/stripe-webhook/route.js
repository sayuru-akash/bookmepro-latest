import { NextResponse } from "next/server";
import connectToDatabase from "../../../Lib/mongodb";
import User from "../../../models/user";
import { getStripeClient } from "../../../Lib/stripeClient";

// Main endpoint to receive webhooks from Stripe
export async function POST(request) {
  const stripe = getStripeClient();
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  // Process the webhook asynchronously to avoid timeouts
  processWebhookAsync(event, stripe);

  // Immediately acknowledge receipt of the webhook to Stripe
  return NextResponse.json({ received: true });
}

// Asynchronous processor for different webhook events
async function processWebhookAsync(event, stripe) {
  try {
    await connectToDatabase();
    // console.log(`Processing webhook event: ${event.type} - ${event.id}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object, stripe);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object, stripe);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      // The payment_method events are kept for completeness
      case "payment_method.attached":
        await handlePaymentMethodAttached(event.data.object);
        break;
      case "payment_method.detached":
        await handlePaymentMethodDetached(event.data.object);
        break;
      default:
      // console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(
      `Error processing webhook event ${event.type} - ${event.id}:`,
      error,
    );
  }
}

// Handles the initial subscription creation
async function handleCheckoutSessionCompleted(session, stripe) {
  // Bug fix: userEmail lives in session.metadata, fall back to customer_email
  const userEmail = session.metadata?.userEmail || session.customer_email;

  if (!userEmail) {
    console.error(
      "CRITICAL: userEmail not found in session metadata or customer_email for session:",
      session.id,
    );
    return;
  }

  if (!session.subscription) {
    // One-time payment — no subscription to process
    return;
  }

  // Bug fix: removed `payment_status === 'paid'` guard.
  // For subscriptions with a trial, Stripe fires checkout.session.completed
  // with payment_status === 'no_payment_required'. Both cases must be handled.
  try {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription,
    );

    const updateData = {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      paymentStatus: subscription.status, // 'trialing' | 'active'
      plan: subscription.metadata?.plan || session.metadata?.plan,
      billingCycle:
        subscription.metadata?.billingCycle || session.metadata?.billingCycle,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
    };

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail.toLowerCase() },
      { $set: updateData },
      { new: true },
    );

    if (!updatedUser) {
      console.error(
        `No user found with email ${userEmail} for session: ${session.id}`,
      );
    }
  } catch (error) {
    console.error(
      `Error in handleCheckoutSessionCompleted for session ${session.id}:`,
      error,
    );
    throw error;
  }
}

// Handles recurring payments after the first one
async function handleInvoicePaid(invoice, stripe) {
  if (!invoice.subscription) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription,
  );

  const updateFields = {
    paymentStatus: subscription.status, // 'active'
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    // Ensure stripeCustomerId is always recorded (handles missed checkout event)
    stripeCustomerId: invoice.customer,
    stripeSubscriptionId: invoice.subscription,
  };

  // Primary lookup: by stripeCustomerId (fast path for existing users)
  let result = await User.findOneAndUpdate(
    { stripeCustomerId: invoice.customer },
    { $set: updateFields },
    { new: true },
  );

  // Bug fix: fallback to email lookup when stripeCustomerId was never saved
  // (happens when checkout.session.completed webhook was missed or failed)
  if (!result && invoice.customer_email) {
    result = await User.findOneAndUpdate(
      { email: invoice.customer_email.toLowerCase() },
      { $set: updateFields },
      { new: true },
    );
    if (!result) {
      console.error(
        `handleInvoicePaid: no user found for customer ${invoice.customer} / email ${invoice.customer_email}`,
      );
    }
  }
}

// Handles failed payments
async function handlePaymentFailed(invoice) {
  await User.findOneAndUpdate(
    { stripeCustomerId: invoice.customer },
    {
      $set: {
        paymentStatus: "past_due",
      },
    },
  );
  // console.log(`User with customer ID ${invoice.customer} marked as past_due.`);
}

// Handles any subscription changes (e.g., upgrade, downgrade, cancellation)
async function handleSubscriptionUpdated(subscription) {
  // Bug fix: subscription.items.data[0].price.lookup_key is the full key
  // e.g. 'starter_quarterly_au' — use subscription.metadata.plan instead
  // which stores just 'starter', as set during checkout session creation.
  const planName = subscription.metadata?.plan || null;

  const updateFields = {
    paymentStatus: subscription.status, // 'active' | 'past_due' | 'canceled'
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };
  if (planName) updateFields.plan = planName;

  await User.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    { $set: updateFields },
  );
}

// Handles the final deletion of a subscription
async function handleSubscriptionDeleted(subscription) {
  // The 'customer.subscription.updated' event with a status of 'canceled' often handles this logic.
  // This handler is for the final, permanent deletion if needed.
  await User.findOneAndUpdate(
    { stripeSubscriptionId: subscription.id },
    {
      $set: {
        paymentStatus: "canceled",
      },
      $unset: {
        stripeSubscriptionId: "", // Remove the subscription ID
      },
    },
  );
}

// The following handlers are for payment method changes.
// They are less critical for core subscription status but good to have.

async function handlePaymentMethodAttached(paymentMethod) {
  await User.findOneAndUpdate(
    { stripeCustomerId: paymentMethod.customer },
    {
      $addToSet: {
        // Avoids adding duplicate payment methods
        paymentMethods: {
          id: paymentMethod.id,
          last4: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        },
      },
    },
  );
}

async function handlePaymentMethodDetached(paymentMethod) {
  await User.findOneAndUpdate(
    { stripeCustomerId: paymentMethod.customer },
    {
      $pull: {
        paymentMethods: { id: paymentMethod.id },
      },
    },
  );
}
