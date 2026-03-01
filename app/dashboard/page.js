//app/dashboard/page.js
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ProfileEditComponent from "../../components/ProfileEditComponent/page";
import DashboardHeader from "../../components/DashboardHeader";
import SideMenu from "../../components/SideMenu";
import AppTheme from "../../app/shared-theme/AppTheme";
import MainGrid from "../../components/MainGrid";
import DashboardWrapper from "../../components/DashboardWrapper"; 
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from "../../app/dashboard/theme/customizations";

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showProfileEdit] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Function to check user status
    // const checkStatus = async () => {
    //   if (!session) return;
    //   try {
    //     const res = await fetch("/api/check-status", {
    //       headers: { "Content-Type": "application/json" },
    //     });
    //     const data = await res.json();
    //     if (!data.isActive) {
    //       signOut({ callbackUrl: "/auth/login?message=payment_declined" });
    //     }
    //   } catch (error) {
    //     console.error("Error checking status:", error);
    //   }
    // };

    // Initial check
    // checkStatus();

    // Periodic check every 5 minutes
    // const interval = setInterval(checkStatus, 5 * 60 * 1000);

    // Cleanup interval on unmount
    // return () => clearInterval(interval);
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <div className="flex flex-col justify-center items-center">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-t-primary border-gray-300 rounded-full animate-spin"></div>
          <div className="mt-4 text-primary text-xl font-semibold">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // // Don't render if not authenticated
  // if (!session) {
  //   return null;
  // }

  // const handleProfileClick = () => {
  //   setShowProfileEdit(true);
  // };

  return (
    <DashboardWrapper>
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <div className="h-full  w-full m-0 p-0">
        {/* Top Header */}
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

        {/* Sidebar */}
        <Box
          sx={{
            width: "250px",
            position: "fixed",
            top: "92px",
            left: 0,
            bottom: 0,
            overflowY: "auto",
            zIndex: 5,
            backgroundColor: "#f4f4f4",
            borderRight: "1px solid #ddd",
          }}
        >
          <SideMenu session={session} />
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            paddingLeft: { md: "350px" },
            paddingTop: "20px",
            overflow: "auto",
            backgroundColor: "white",
            minHeight: "100vh",
            fontFamily: "Kanit, sans-serif",
            width: "100%",
          }}
        >
          <Stack direction="column" spacing={2} padding={3}>
            {showProfileEdit ? <ProfileEditComponent /> : <MainGrid />}
          </Stack>
        </Box>
      </div>
    </AppTheme>
    </DashboardWrapper>
  );
}
