//components/LoginForm.js
"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ closeModal }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [needsPayment, setNeedsPayment] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const message = searchParams.get("message");
  const success = searchParams.get("success");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      console.log("Session Data:", session.user);
      // Check payment status after successful login
      if (
        session.user.paymentStatus === "inactive" ||
        session.user.paymentStatus === "canceled"
      ) {
        setNeedsPayment(true);
      } else {
        closeModal();
        router.push("/dashboard");
      }
    }
  }, [status, session, router, closeModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If the user is authenticated but payment is inactive, show a message with a button
  if (needsPayment && session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-min bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105">
          <div className="text-center">
            <svg
              className="mx-auto h-16 w-16 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-800">
              Subscription Inactive
            </h2>
            <p className="mt-2 text-gray-600">
              Your subscription is currently inactive. To continue using the
              platform, please complete your payment setup.
            </p>
          </div>
          <button
            onClick={() => {
              router.push(`/dashboard/upgrade-plan`);
              closeModal();
            }}
            className="w-full py-3 px-4 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200"
          >
            Go to Payment
          </button>

          {/* <p className="text-sm text-center text-gray-500">
            Need help?{" "}
            <a
              href="/support"
              className="text-yellow-500 hover:underline"
            >
              Contact Support
            </a>
          </p> */}
        </div>
      </div>
    );
  }

  // Otherwise, show the login form
  return (
    <div className="flex flex-col items-center justify-center min-h-auto bg-gradient-to-r p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        {success === "password_reset" && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
            Password has been reset successfully. Please log in.
          </div>
        )}
        {/* Payment Status Messages (from query params) */}
        {message === "payment_required" && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
            Please complete your subscription to access the platform.
          </div>
        )}
        {message === "payment_failed" && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            Payment processing failed. Please try again.
          </div>
        )}

        <h2 className="text-3xl font-bold text-center text-gray-800">
          Welcome Back
        </h2>
        <p className="text-sm text-center text-gray-600">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {/*Added Forgot Password Link */}
          <div className="text-sm text-right">
            <Link
              href="/auth/forgot-password"
              onClick={closeModal}
              className="font-medium text-primary hover:text-primary-dark"
            >
              Forgot Password?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </div>

          {error &&
            error !==
              "Subscription required. Please complete your payment setup." && (
              <div className="text-red-500 text-sm text-center p-3 bg-red-50 rounded-md">
                {error}
              </div>
            )}

          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              setIsLoading(true);
              signIn("google", { callbackUrl: "/auth/payment" });
            }}
            className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 transition-transform duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 48 48"
            >
              <defs>
                <path
                  id="a"
                  d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
                />
              </defs>
              <clipPath id="b">
                <use xlinkHref="#a" overflow="visible" />
              </clipPath>
              <path clipPath="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z" />
              <path
                clipPath="url(#b)"
                fill="#EA4335"
                d="M0 11l17 13 7-6.1L48 14V0H0z"
              />
              <path
                clipPath="url(#b)"
                fill="#34A853"
                d="M0 37l30-23 7.9 1L48 0v48H0z"
              />
              <path
                clipPath="url(#b)"
                fill="#4285F4"
                d="M48 48L17 24l-4-3 35-10z"
              />
            </svg>
            <span className="ml-2">Login with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
}
