// app/dashboard/upgrade-plan/page.js
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocationPricing } from "../../../app/hooks/useLocationPricing";
import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import DashboardHeader from "../../../components/DashboardHeader";
import AppTheme from "../../../app/shared-theme/AppTheme";
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from "../../../app/dashboard/theme/customizations";
import axios from "axios";

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function UpgradePlan(props) {
  const { data: session } = useSession();
  const router = useRouter();
  // --- FIX 1: Change state from boolean to plan identifier ---
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { countryCode, getAllPlansWithPricing, formatPrice } =
    useLocationPricing(session?.user?.countryCode);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const plans = getAllPlansWithPricing(billingCycle);

  // --- FIX 2: Update handler function ---
  const handleSelectPlan = async (planName) => {
    setLoadingPlan(planName);
    try {
      const response = await axios.post("/api/stripe/create-upgrade-session", {
        planName,
        billingCycle,
        countryCode,
      });

      if (response.data.url) {
        router.push(response.data.url);
      }
    } catch (error) {
      console.error("Error creating upgrade session:", error);
      setLoadingPlan(null);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <div className="h-full w-full m-0 p-0">
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            paddingTop: "25px",
            paddingLeft: "20px",
            paddingRight: "20px",
            height: "82px",
            zIndex: 10,
            backgroundColor: "white",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <DashboardHeader />
        </Box>

        <Box
          component="section"
          sx={{
            overflow: "auto",
            minHeight: "100vh",
            bgcolor: "#f9fafb",
            pt: { xs: 12, sm: 12, md: 14 },
            pb: { xs: 6, sm: 8, md: 12 },
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ textAlign: "center", mb: { xs: 6, sm: 8, md: 10 } }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: "#036b34",
                  fontFamily: "Kanit, sans-serif",
                  mb: 2,
                  fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                }}
              >
                Upgrade Your Plan
              </Typography>
              <Typography
                variant="h6"
                component="p"
                sx={{
                  color: "#6b7280",
                  fontFamily: "Kanit, sans-serif",
                  fontWeight: 400,
                  fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" },
                  maxWidth: "600px",
                  mx: "auto",
                  lineHeight: 1.6,
                }}
              >
                Choose the perfect plan to grow your coaching business and
                unlock your full potential
              </Typography>
            </Box>

            <div className="flex justify-center mb-6">
              {["monthly", "quarterly", "yearly"].map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={`px-4 py-2 border ${
                    billingCycle === cycle
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }focus:outline-none focus:ring-2 focus:ring-primary`}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
              {Object.keys(plans).map((planName) => {
                const plan = plans[planName];
                if (!plan.currentPricing) return null;
                const { amount, currency, symbol, cycle } = plan.currentPricing;
                return (
                  <div
                    key={plan.name}
                    className="bg-white p-8 lg:p-10 rounded-2xl shadow-md text-center border border-primary-light hover:scale-105 transform transition-all duration-300 min-h-[320px] lg:min-h-[380px] flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="text-xl lg:text-2xl font-semibold text-primary-dark mb-3 lg:mb-4">
                        {planName.charAt(0).toUpperCase() + planName.slice(1)}
                      </h3>
                      <p className="text-gray-500 text-sm lg:text-base mb-6 lg:mb-8">
                        {plan.description}
                      </p>

                      <div className="mb-6 lg:mb-8">
                        <span className="text-3xl lg:text-4xl font-bold text-primary-dark">
                          {formatPrice(amount, currency, symbol)}
                        </span>
                        <span className="text-gray-500 text-sm lg:text-base block mt-2">
                          /{" "}
                          {cycle === "quarterly"
                            ? "quarter"
                            : cycle.replace("ly", "")}
                        </span>
                      </div>
                    </div>

                    <button
                      className="w-full bg-primary text-white py-3 lg:py-4 rounded-lg font-medium hover:bg-primary-dark text-base lg:text-lg"
                      onClick={() => handleSelectPlan(planName)}
                      // --- FIX 3: Update disabled and text logic ---
                      disabled={loadingPlan !== null}
                      sx={{
                        minHeight: { xs: "48px", lg: "56px" },
                        fontSize: { xs: "1rem", lg: "1.125rem" },
                      }}
                    >
                      {loadingPlan === planName
                        ? "Processing..."
                        : `Choose ${planName}`}
                    </button>
                  </div>
                );
              })}
            </div>
            <Box sx={{ textAlign: "center", mt: { xs: 4, sm: 6 } }}>
              <Button
                size="large"
                sx={{
                  color: "#036b34",
                  fontFamily: "Kanit, sans-serif",
                  fontWeight: 600,
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "rgba(3, 107, 52, 0.08)",
                    transform: "translateY(-1px)",
                  },
                }}
                onClick={handleGoBack}
              >
                ← Back to Dashboard
              </Button>
            </Box>
          </Container>
        </Box>
      </div>
    </AppTheme>
  );
}
