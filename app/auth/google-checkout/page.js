"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

function GoogleCheckoutContent() {
  const { data: session, status } = useSession();
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Only proceed if the session is loaded and authenticated
    if (status !== "authenticated") return;

    const startCheckout = async () => {
      const plan = params.get("plan");
      const billingCycle = params.get("billingCycle");
      const countryCode = params.get("countryCode");
      const name = session?.user?.name || "";
      const email = session?.user?.email || "";
      
      // Basic validation
      if (!plan || !billingCycle || !countryCode || !name || !email) {
        console.error("Missing required data for checkout.");
        // Redirect to a generic pricing or error page if essential data is missing
        router.replace("/pricing"); 
        return;
      }

      try {
        // Single API call to handle both new and existing Google users
        const response = await fetch("/api/auth/google-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: name.split(' ')[0] || name,
            lastName: name.split(' ').slice(1).join(' ') || '',
            email,
            plan,
            billingCycle,
            countryCode,
          }),
        });

        const data = await response.json();

        if (response.ok && data.checkoutUrl) {
          // On success, redirect to Stripe for payment
          window.location.href = data.checkoutUrl;
        } else {
          // Handle any errors from the API
          console.error("Failed to initiate checkout:", data.message);
          router.replace(`/auth/signup?error=${encodeURIComponent(data.message || 'An unexpected error occurred.')}`);
        }
      } catch (err) {
        console.error("An error occurred during checkout:", err);
        router.replace(`/auth/signup?error=${encodeURIComponent('Could not connect to the server.')}`);
      }
    };

    startCheckout();

  }, [status, session, params, router]);

  // Display a loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">
          Please wait, we&apos;re securely redirecting you to payment...
        </p>
      </div>
    </div>
  );
}

export default function GoogleCheckoutPage() {
  return (
    <Suspense fallback={ // A simple loading fallback for the Suspense boundary
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    }>
      <GoogleCheckoutContent />
    </Suspense>
  );
}