"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight } from "lucide-react";

export default function HomeAuthAction({ className }) {
  const { data: session } = useSession();

  const isCoach = session?.user?.role === "coach";
  const hasCoachAccess =
    isCoach &&
    (session?.user?.paymentStatus === "active" ||
      session?.user?.paymentStatus === "trialing");

  const accountHref = hasCoachAccess
    ? "/dashboard"
    : session?.user?.role === "student"
      ? "/student-dashboard"
      : session?.user?.role === "admin"
        ? "/bmpadmin/dashboard"
        : "/auth/signup";

  const accountLabel = hasCoachAccess
    ? "Open Coach Dashboard"
    : session?.user?.role === "student"
      ? "Open Student Dashboard"
      : session?.user?.role === "admin"
        ? "Open Admin Dashboard"
        : isCoach
          ? "Choose Your Plan"
          : "Create Your Free Account";

  return (
    <Link href={accountHref} className={className}>
      {accountLabel}
      <ArrowRight size={18} />
    </Link>
  );
}
