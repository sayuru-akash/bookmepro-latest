// app/auth/payment/page.js
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ProgressBar from "../../../components/ProgressBar";

function PaymentContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loadingPrice, setLoadingPrice] = useState(true);
  const planFromUrl = searchParams.get("plan");
  const billingCycleFromUrl = searchParams.get("billingCycle");
  const countryCodeFromUrl = searchParams.get("countryCode");
  const userPlan = session?.user?.plan || "";
  const userBillingCycle = session?.user?.billingCycle || "";
  const userCountryCode = session?.user?.countryCode || "";

  // Use URL parameters if provided; otherwise fall back to the user's current subscription details.
  const plan = planFromUrl || userPlan;
  const billingCycle = billingCycleFromUrl || userBillingCycle;
  const countryCode = countryCodeFromUrl || userCountryCode;

  // Other values from URL or session
  const email = searchParams.get("email") || session?.user?.email || "";
  const name = searchParams.get("name") || session?.user?.firstName || "";

  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(true);
  const [error, setError] = useState(null);

  // Removed the URL validation useEffect so that URL params can override user details.
  // Fetch price from packages collection based on the current plan and billingCycle
  useEffect(() => {
    // --- THIS IS THE FIX ---
    // Guard Clause: Do not attempt to fetch a price until we have all the required info.
    if (!plan || !billingCycle || !countryCode) {
      setFetchingPrice(false);
      return;
    }
    setError(null); // Clear previous errors

    const fetchPrice = async () => {
      setFetchingPrice(true); // Ensure spinner shows for new fetches
      try {
        const response = await fetch(
          `/api/packages?plan=${plan}&billingCycle=${billingCycle}&countryCode=${countryCode}`
        );
        const data = await response.json();

        if (response.ok && data.price) {
          setPrice(data.price);
        } else {
          console.error("Error fetching price:", data.message);
          setError(data.message || "Failed to fetch pricing details.");
        }
      } catch (error) {
        console.error("Error fetching price:", error);
        setError(
          "An unexpected error occurred while fetching pricing details."
        );
      } finally {
        setFetchingPrice(false);
      }
    };

    fetchPrice();
  }, [plan, billingCycle, countryCode]);

  const handleSubscribe = async () => {
    if (error) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, plan, billingCycle, countryCode }),
      });

      const data = await res.json();

      // If the response is NOT okay, handle the error from the API
      if (!res.ok) {
        throw new Error(data.error || "An unknown error occurred.");
      }

      // Success, redirect to Stripe
      window.location.href = data.url;
    } catch (err) {
      console.error("Error creating checkout session:", err);
      // Set the error state so the user sees the specific message
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <ProgressBar currentStep={2} />
        <h2 className="text-center text-2xl font-bold mt-4">Payment</h2>

        {error ? (
          <p className="text-red-500 text-center mt-4">{error}</p>
        ) : (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Subscription Details</h3>
            <div className="space-y-2 text-gray-700">
              {name && (
                <p>
                  <span className="font-medium">Name:</span> {name}
                </p>
              )}
              <p>
                <span className="font-medium">Plan:</span>{" "}
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </p>
              <p>
                <span className="font-medium">Price:</span>{" "}
                {fetchingPrice ? "Loading..." : `$${price}`}
              </p>
              <p>
                <span className="font-medium">Billing Cycle:</span>{" "}
                {billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}
              </p>
              <p>
                <span className="font-medium">Email:</span> {email}
              </p>
            </div>
          </div>
        )}

        {!error && (
          <>
            <p className="text-center mt-4 text-gray-600">
              Enjoy a <strong>1 Month Free Trial</strong> with your
              subscription!
            </p>
            <button
              onClick={handleSubscribe}
              disabled={loading || fetchingPrice || !price}
              className="w-full mt-6 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Subscribe Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
            <span className="text-slate-600 font-medium">Loading...</span>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
