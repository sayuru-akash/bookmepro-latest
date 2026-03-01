// page.js
"use client"; // Mark this as a Client Component

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardHeader from "../../../components/DashboardHeader";
import Box from "@mui/material/Box";
import ProfileEditComponent from "../../../components/ProfileEditComponent/page";
// import DashboardHeader from "../../../components/DashboardHeader";
import SideMenu from "../../../components/SideMenu";
import AppTheme from "../../../app/shared-theme/AppTheme";
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from "../../../app/dashboard/theme/customizations";
import CustomizedDataGrid from "../../../app/dashboard/my-bookings/dataGrid";
import CalendarWithAppointments from "./CalendarWithAppointments";

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

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

  // const handleDateClick = (date) => {
  //   setSelectedDate(date); // Store the selected date
  //   setShowDataGrid(true); // Show the data grid
  // };

  const handleProfileClick = () => setShowProfileEdit(true);

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <div className="h-full w-full m-0 p-0">
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
            // paddingTop: "20px",
            overflow: "auto",
            backgroundColor: "white",
            minHeight: "100vh",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {/* Calendar Section */}
          <Box
            sx={{
              // marginTop:"60px",
              backgroundColor: "white",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CalendarWithAppointments />
          </Box>
        </Box>
      </div>
    </AppTheme>
  );
}
