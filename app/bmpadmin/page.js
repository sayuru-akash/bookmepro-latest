// app/bmpadmin/page.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminLogin from "../../components/AdminLogin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if the admin is already authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.role === "admin") {
      router.push("/bmpadmin/dashboard/coach");
    }
  }, [session, status, router]);

  const handleLoginSuccess = () => {
    router.push("/bmpadmin/dashboard/coach");
  };

  return (
    <div>
      <AdminLogin onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}
