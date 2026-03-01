//app/auth/payment/payment-success/page.js
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ProgressBar from "../../../../components/ProgressBar";
import { signOut } from "next-auth/react";

function PaymentSuccessContent() {
  const router = useRouter();
  const { update } = useSession();
  const searchParams = useSearchParams();

  const [paymentStatus, setPaymentStatus] = useState("processing");
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Refs ensure timer IDs are stable across re-renders
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Extract necessary information from URL query parameters
  const name = searchParams.get("name") || "";
  const plan = searchParams.get("plan") || "";
  const email = searchParams.get("email") || "";
  const sessionId = searchParams.get("session_id") || "";

  useEffect(() => {
    // Guard clause: Do not proceed if there's no session ID
    if (!sessionId) {
      console.warn("No session_id found in URL parameters.");
      setPaymentStatus("error");
      setError("A session ID is required to verify payment.");
      return;
    }

    // A helper function for sending the welcome email
    const sendWelcomeEmail = async () => {
      if (!emailSent && email && name && plan) {
        try {
          const emailRes = await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, plan }),
          });

          if (emailRes.ok) {
            setEmailSent(true); // Prevent sending multiple emails
            // console.log("Welcome email request sent successfully.");
          } else {
            const emailErrorBody = await emailRes.json();
            console.error("Failed to send welcome email:", emailErrorBody);
          }
        } catch (emailError) {
          console.error("Error calling send-welcome-email API:", emailError);
        }
      }
    };

    // The core function to check payment status
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(
          `/api/check-payment-status?session_id=${sessionId}`
        );

        if (!res.ok) {
          const errorBody = await res.json();
          throw new Error(
            errorBody.message || "Failed to fetch payment status"
          );
        }

        const data = await res.json();

        // --- CORRECTED LOGIC ---
        // We check for the subscription's status, which should be 'trialing' or 'active'.
        if (
          data.status === "trialing" ||
          data.status === "active" ||
          data.payment_status === "paid"
        ) {
          setPaymentStatus("confirmed");

          // Stop all timers immediately on success
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);

          // Update the user's session in NextAuth
          await update();

          // Send the welcome email now that payment is confirmed
          sendWelcomeEmail();
        } else if (data.status === "incomplete" || data.status === "past_due") {
          setPaymentStatus("requires_action");
          setError(
            "Payment requires additional action. Please check your email."
          );
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
        }
        // If status is still processing, the interval will simply run again.
      } catch (err) {
        console.error("Payment verification error:", err);
        setPaymentStatus("error");
        setError("Unable to verify payment status. Please contact support.");
        // Stop polling on any fetch error
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
      }
    };

    // --- Polling Logic ---
    checkPaymentStatus(); // Check immediately on component load
    intervalRef.current = setInterval(checkPaymentStatus, 3000); // Poll every 3 seconds

    // Set a timeout to prevent infinite polling
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      // Only set error if it's still processing
      if (paymentStatus === "processing") {
        setError(
          "Confirmation is taking longer than expected. Please contact support."
        );
        setPaymentStatus("error");
      }
    }, 30000); // 30-second timeout

    // Cleanup function to clear timers when the component unmounts
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
    // The dependency array ensures this effect runs only when necessary
  }, [sessionId, email, name, plan, update, emailSent, paymentStatus]);

  // --- JSX for different payment statuses ---

  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Checking Payment Status</h1>
          <p className="text-gray-700">
            Please wait while we confirm your subscription and prepare your
            account...
          </p>
        </div>
      </div>
    );
  }

  if (paymentStatus === "error" || paymentStatus === "requires_action") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            Payment Issue Detected
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "There was an issue processing your payment. Please try again."}
          </p>
          <button
            onClick={() => router.push("/auth/payment")}
            className="py-2 px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 transition duration-300"
          >
            Retry Payment
          </button>
        </div>
      </div>
    );
  }

  // --- Success JSX ---
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black">
            Payment Successful!
          </h1>
          <p className="mt-4 text-base sm:text-lg md:text-xl text-gray-600">
            Hi {name}, your {plan} plan subscription is now active.
          </p>
          <div className="mt-6">
            <ProgressBar currentStep={3} />
          </div>
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              router.push("/auth/login");
            }}
            className="mt-6 py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-white bg-primary hover:bg-green-800 transition duration-300"
          >
            Proceed to Login
          </button>
        </div>
        <div className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center">
          <div className="w-full sm:w-[75vw] md:w-[60vw] lg:w-[50vw] h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh]">
            <video
              className="w-full h-full object-cover rounded-lg shadow-xl"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/Mobile Payment.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component export with Suspense for search params
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading payment details...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
