// app/components/SubscriptionModal.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SubscriptionModal({ isOpen, paymentStatus }) {
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
  };

  const getModalMessage = () => {
    switch (paymentStatus) {
      case "canceled": // Stripe uses US spelling (one 'l')
        return "Your subscription has been cancelled. Please reactivate your subscription to continue.";
      case "past_due":
        return "Your subscription payment is past due. Please update your payment method to restore access.";
      case "inactive":
        return "Your subscription is inactive. Please subscribe to access the system.";
      default:
        return "Your subscription is no longer active. Please subscribe to continue accessing the system.";
    }
  };

  return (
    // Higher z-index to appear above Material-UI components
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
        <div className="mb-4">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900">Access Denied</h2>

        <p className="text-gray-700 mb-6">{getModalMessage()}</p>

        <div className="space-y-3">
          <Link
            href="/dashboard/upgrade-plan"
            className="block w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Subscribe Now
          </Link>

          <button
            onClick={handleSignOut}
            className="block w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {paymentStatus && (
          <p className="text-sm text-gray-500 mt-4">
            Current status:{" "}
            <span className="font-semibold">{paymentStatus}</span>
          </p>
        )}
      </div>
    </div>
  );
}
