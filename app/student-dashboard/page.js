// app/student-dashboard/page.js
"use client";
import React, { useCallback, useEffect, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import AppTheme from "../shared-theme/AppTheme";
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from "../dashboard/theme/customizations";
import Header from "../../components/header";
import StudentSidemenu from "../../components/StudentSidemenu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Pagination from '@mui/material/Pagination';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function StudentDashboard(props) {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const studentData =
        typeof localStorage !== "undefined"
          ? JSON.parse(localStorage.getItem("studentData"))
          : null;
      const studentId = studentData?.id || session?.user?.id;
      if (!studentId) {
        throw new Error("Student ID not found");
      }
      const response = await fetch(
        `/api/student-appointments?studentId=${studentId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }
      // Transform dates and sort
      const sortedAppointments = data
        .map((app) => ({
          ...app,
          selectedDate: new Date(app.selectedDate),
        }))
        .sort((a, b) => b.selectedDate - a.selectedDate);
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError(error.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAppointments = appointments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(appointments.length / itemsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (status === "loading") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!session || session.user.role !== "student") {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Alert severity="error">
          Unauthorized access. Please log in as a student.
        </Alert>
      </Box>
    );
  }

  const handleRefresh = () => {
    fetchAppointments();
    setCurrentPage(1); // Reset to first page on refresh
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <div className="h-full w-full m-0 p-0">
        <Header />

        {/* Mobile Menu Toggle Button */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            position: "fixed",
            top: "100px",
            left: "10px",
            zIndex: 10,
          }}
        >
          <IconButton
            onClick={toggleMobileMenu}
            aria-label="Open menu"
            sx={{
              backgroundColor: "white",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Desktop Sidemenu */}
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
            display: { xs: "none", md: "block" },
          }}
        >
          <StudentSidemenu />
        </Box>

        {/* Mobile Sidemenu - shows when toggled */}
        <Box
          sx={{
            width: "100%",
            position: "fixed",
            top: "92px",
            left: 0,
            bottom: 0,
            overflowY: "auto",
            zIndex: 20,
            backgroundColor: "#f4f4f4",
            borderRight: "1px solid #ddd",
            transform: mobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease-in-out",
            display: { xs: "block", md: "none" },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
            <IconButton onClick={toggleMobileMenu} aria-label="Close menu">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </IconButton>
          </Box>
          <StudentSidemenu />
        </Box>

        <Box
          sx={{
            paddingLeft: { xs: "20px", md: "350px" },
            paddingTop: "60px",
            overflow: "auto",
            backgroundColor: "white",
            minHeight: "100vh",
            fontFamily: "Kanit, sans-serif",
            width: "100%",
            transition: "padding-left 0.3s ease-in-out",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 mt-4">
            {" "}
            {/* Added mt-4 for more top margin */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                Your Appointments
              </h2>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 4,
                }}
              >
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={handleRefresh}>
                    Retry
                  </Button>
                }
                sx={{ mb: 3 }}
              >
                {error}
              </Alert>
            ) : appointments.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  py: 8,
                  textAlign: "center",
                }}
              >
                <p className="text-gray-500 text-lg mb-4">
                  You don&apos;t have any appointments yet
                </p>
                <Button
                  variant="contained"
                  onClick={() => router.push("/coaches")}
                >
                  Find a Coach
                </Button>
              </Box>
            ) : (
              <div className="space-y-4">
                {currentAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="border rounded-lg p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {appointment.coach?.firstName}{" "}
                          {appointment.coach?.lastName}
                        </h3>
                        <div className="flex flex-col md:flex-row md:items-center mt-2 space-y-2 md:space-y-0 md:space-x-4">
                          <div className="flex items-center text-gray-600">
                            <svg
                              className="w-5 h-5 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{formatDate(appointment.selectedDate)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg
                              className="w-5 h-5 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{appointment.selectedTime?.value || appointment.selectedTime}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>

                    {appointment.appointmentDetails && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                          Appointment Details
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {appointment.appointmentDetails}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {appointments.length > itemsPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="#037D40"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </div>
            )}
          </div>
        </Box>
      </div>
    </AppTheme>
  );
}
