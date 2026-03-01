// lib/stripe.js
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  "pk_test_51QwZlmL7pobOZ8obSJn2kDfvtaT72YR2Ila7lPwHMwE4YzQ0yAoIwhhUtFk7mxsztftrbbfiG6DK0vtJg4IAJBaE00ylpKSx0T"
);
