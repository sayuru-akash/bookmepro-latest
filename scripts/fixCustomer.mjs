import Stripe from "stripe";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

// ─── CONFIG ────────────────────────────────────────────────────────────────
const TARGET_EMAIL = "rumeshthirimanna@gmail.com"; // <-- customer email
// ───────────────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

if (!MONGODB_URI || !MONGODB_DB || !STRIPE_SECRET_KEY) {
  console.error(
    "Missing env vars. Check MONGODB_URI, MONGODB_DB, STRIPE_SECRET_KEY in .env.local",
  );
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function run() {
  console.log(`\n🔍 Looking up Stripe customer for: ${TARGET_EMAIL}`);

  // Find Stripe customer by email
  const customers = await stripe.customers.list({
    email: TARGET_EMAIL,
    limit: 5,
  });
  if (!customers.data.length) {
    console.error("❌ No Stripe customer found for this email.");
    process.exit(1);
  }
  const customer = customers.data[0];
  console.log(`Found Stripe customer: ${customer.id}`);

  // Get all subscriptions for this customer
  const subs = await stripe.subscriptions.list({
    customer: customer.id,
    limit: 10,
    status: "all",
  });

  if (!subs.data.length) {
    console.error("No subscriptions found for this customer in Stripe.");
    process.exit(1);
  }

  // Prefer active > trialing > past_due > others
  const priority = [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
  ];
  const subscription = subs.data.sort(
    (a, b) => priority.indexOf(a.status) - priority.indexOf(b.status),
  )[0];

  console.log(`\n📋 Stripe Subscription Details:`);
  console.log(`   ID:     ${subscription.id}`);
  console.log(`   Status: ${subscription.status}`);
  console.log(
    `   Period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`,
  );
  console.log(
    `   Trial end:  ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : "none"}`,
  );
  console.log(`   Metadata:   ${JSON.stringify(subscription.metadata)}`);

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log("\nConnected to MongoDB");

  const db = mongoose.connection.db;
  const usersCollection = db.collection("users");

  // Find the user
  const user = await usersCollection.findOne({
    email: TARGET_EMAIL.toLowerCase(),
  });
  if (!user) {
    console.error(`User not found in MongoDB with email: ${TARGET_EMAIL}`);
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`\nCurrent MongoDB State:`);
  console.log(`   paymentStatus: ${user.paymentStatus}`);
  console.log(`   stripeCustomerId: ${user.stripeCustomerId || "NOT SET"}`);
  console.log(
    `   stripeSubscriptionId: ${user.stripeSubscriptionId || "NOT SET"}`,
  );
  console.log(`   plan: ${user.plan}`);
  console.log(`   billingCycle: ${user.billingCycle}`);

  // Build the patch from real Stripe data
  const planName = subscription.metadata?.plan || null;
  const billingCycle = subscription.metadata?.billingCycle || null;

  const patch = {
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    paymentStatus: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
  };
  if (planName) patch.plan = planName;
  if (billingCycle) patch.billingCycle = billingCycle;

  // Apply
  const result = await usersCollection.findOneAndUpdate(
    { email: TARGET_EMAIL.toLowerCase() },
    { $set: patch },
    { returnDocument: "after" },
  );

  console.log(`\nMongoDB Updated Successfully!`);
  console.log(`   paymentStatus: ${result.paymentStatus}`);
  console.log(`   stripeCustomerId: ${result.stripeCustomerId}`);
  console.log(`   stripeSubscriptionId: ${result.stripeSubscriptionId}`);
  console.log(`   plan: ${result.plan}`);
  console.log(`   billingCycle: ${result.billingCycle}`);
  console.log(`\nCustomer can now log in to their dashboard!\n`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
