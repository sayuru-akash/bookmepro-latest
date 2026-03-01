// components/Pricing.js
"use client";
import { useState } from "react";
import { useLocationPricing } from "../app/hooks/useLocationPricing";

export default function Pricing({ initialCountryCode }) {
  const { countryCode, getAllPlansWithPricing, formatPrice } =
    useLocationPricing(initialCountryCode);

  const [billingCycle, setBillingCycle] = useState("monthly");

  const plans = getAllPlansWithPricing(billingCycle);

  if (!plans || Object.keys(plans).length === 0) {
    return (
      <section id="pricing" className="py-10">
        <div className="text-center">Loading pricing plans...</div>
      </section>
    );
  }

  return (
    <section id="pricing">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Choose Your Plan
        </h2>

        {/* Billing cycle selector */}
        <div className="flex justify-center mb-10 rounded-lg p-1 bg-gray-200/60 w-fit mx-auto">
          {["monthly", "quarterly", "yearly"].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 focus:outline-none ${
                billingCycle === cycle
                  ? "bg-primary text-white shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-primary"
              }`}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </button>
          ))}
        </div>

        {/* Pricing cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(plans).map((planName) => {
            const plan = plans[planName];

            // Defensive check in case pricing data is missing for a plan
            if (!plan.currentPricing) return null;

            const { amount, currency, symbol, cycle } = plan.currentPricing;

            const signupUrl = `/auth/signup?plan=${planName}&billingCycle=${cycle}&countryCode=${countryCode}`;

            return (
              <div
                key={planName}
                className="bg-white p-6 rounded-2xl shadow-md text-center border border-gray-200 hover:border-primary hover:scale-105 transform transition-all duration-300 flex flex-col"
              >
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {planName.charAt(0).toUpperCase() + planName.slice(1)}
                  </h3>
                  <p className="text-gray-500 mt-2">{plan.description}</p>

                  <div className="my-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(amount, currency, symbol)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      /{" "}
                      {cycle === "quarterly"
                        ? "quarter"
                        : cycle.replace("ly", "")}
                    </span>
                  </div>
                </div>

                <a
                  href={signupUrl}
                  className="mt-4 block w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors duration-200"
                >
                  Get 1 Month Free Trial
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
