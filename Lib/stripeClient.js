import Stripe from "stripe";

export const getStripeClient = () => {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key);
};
