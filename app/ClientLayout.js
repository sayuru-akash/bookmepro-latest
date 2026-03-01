"use client";

import { usePathname } from "next/navigation";
import Header from "../components/header";
import Footer from "../components/footer";
import { SessionProvider } from "next-auth/react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../Lib/stripe";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import axios from "axios";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Determine if the current page is the coach profile page
  const isCoachProfilePage = pathname?.startsWith("/coach/");
  const isStudentDashboard = pathname?.startsWith("/student-dashboard");
  const isAdminLoginPage = pathname?.startsWith("/bmpadmin");
  const showHeader = !pathname?.startsWith("/dashboard");
  
  const showFooter = !(
    pathname?.startsWith("/dashboard") ||
    isCoachProfilePage ||
    isStudentDashboard ||
    isAdminLoginPage
  );

  useEffect(() => {
    const initializeCronJobs = async () => {
      try {
        // Only run this once on mount
        await axios.get("/api/cron");
      } catch (error) {
        console.error("Error initializing cron jobs:", error);
      }
    };

    initializeCronJobs();
  }, []);

  return (
    <SessionProvider>
      <Elements stripe={stripePromise}>
        {showHeader && <Header />}
        {children}
        {showFooter && <Footer />}
        <ToastContainer />
      </Elements>
    </SessionProvider>
  );
}
