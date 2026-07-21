"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignOutCard() {
  const searchParams = useSearchParams();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      localStorage.removeItem("studentData");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      await signOut({ redirect: true, callbackUrl });
    } catch (error) {
      console.error("Error during logout:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f5] px-4 pb-16 pt-32 sm:pt-40">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <section className="w-full rounded-2xl border border-[#dce8e0] bg-white p-7 text-center shadow-[0_14px_40px_rgba(1,53,27,0.08)] sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
            <svg
              aria-hidden="true"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#1d2b24]">Sign out?</h1>
          <p className="mt-2 text-sm leading-6 text-[#5b6b62] sm:text-base">
            You’ll need to sign in again to access your BookMePro dashboard.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full rounded-lg bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-[#036b34] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
            <Link
              href="/"
              className="w-full rounded-lg border border-[#bdd7c8] px-5 py-3 font-semibold text-primary transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Stay signed in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignOutPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f7f5]" />}>
      <SignOutCard />
    </Suspense>
  );
}
