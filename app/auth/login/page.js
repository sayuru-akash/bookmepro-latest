// auth/login/page.js
"use client";
import { Suspense, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import ProgressBar from "../../../components/ProgressBar";
import { useRouter, useSearchParams } from "next/navigation";

function Login() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Check payment status through backend instead of session
      const checkPaymentStatus = async () => {
        try {
          const res = await fetch("/api/check-payment-status");
          const data = await res.json();

          // need to add inactive and cancelled status
          if (
            data.paymentStatus === "inactive" ||
            data.paymentStatus === "canceled"
          ) {
            router.push("/auth/payment");
          } else {
            router.push("/dashboard");
          }
        } catch (error) {
          console.error("Payment status check failed:", error);
          router.push("/dashboard");
        }
      };

      checkPaymentStatus();
    }
  }, [status, session, router]);

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
        if (result.error.includes("Payment required")) {
          router.push("/auth/payment");
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {message === "payment_required" && (
        <div className="bg-yellow-500 text-white p-3 rounded mb-6">
          Please complete your subscription to access the platform
        </div>
      )}
      {message === "payment_failed" && (
        <div className="bg-red-500 text-white p-3 rounded mb-6">
          Payment processing failed. Please try again.
        </div>
      )}

      <div
        className="grid place-items-center mt-20 mb-20"
        style={{
          background:
            "url('https://www.codingnepalweb.com/demos/create-glassmorphism-login-form-html-css/hero-bg.jpg') center/cover",
        }}
      >
        <div className="text-left mt-20">
          <ProgressBar currentStep={3} />
        </div>

        <div
          className="w-full max-w-md p-8 sm:p-10 rounded-xl shadow-lg"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: "12px",
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Login</h2>
          <p className="text-sm sm:text-base text-[#000000] mb-6">
            If you have an account, please login
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 sm:gap-6"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="py-3 px-4 border-2 rounded-lg text-sm w-full bg-gray-100"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="py-3 px-4 border-2 rounded-lg text-sm w-full bg-gray-100"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 rounded-lg text-white font-semibold bg-primary hover:bg-primary-dark transition-all duration-300 w-full"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>

            {error && (
              <div className="bg-red-500 text-white p-3 rounded mt-4 text-center">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault();
                setIsLoading(true);
                signIn("google", { callbackUrl: "/dashboard" });
              }}
              className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 transition-transform duration-300"
            >
              {/* Google SVG Icon */}
              <span className="ml-2">Login with Google</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}