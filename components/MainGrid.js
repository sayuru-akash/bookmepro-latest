// components/MainGrid.js
"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import StatCard from "./StatCard";
import Grid from "@mui/material/Grid";
import SessionsChart from "./SessionsChart";
import BookingRequestStats from "./BookingRequestStats";
import Stack from "@mui/material/Stack";
import CustomizedDataGrid from "./CustomizedDataGrid";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import StudentStatsCard from "./CardAlert";

export default function MainGrid() {
  const { data: session } = useSession();
  const router = useRouter();
  const [todaysBookings, setTodaysBookings] = useState(null);
  const [allTimeBookings, setAllTimeBookings] = useState(null);
  const [totalSignup, setTotalSignup] = useState(null);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [studentExceeded, setStudentExceeded] = useState(false);
  const [studentLimitInfo, setStudentLimitInfo] = useState({
    current: 0,
    max: 0,
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const fetchData = async (coachId) => {
    try {
      const [todayResponse, allTimeResponse] = await Promise.all([
        axios.get("/api/stats", { params: { coachId } }),
        axios.get("/api/stats", { params: { coachId, allTime: true } }),
      ]);

      setTodaysBookings(todayResponse.data.appointments.length);
      setAllTimeBookings(allTimeResponse.data.appointments.length);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data.");
    }
  };

  const fetchStudentCount = async (coachId) => {
    try {
      const [studentCountRes, coachRes] = await Promise.all([
        axios.get(`/api/student-count`, { params: { coachId } }),
        axios.get(`/api/coach/${coachId}`),
      ]);

      const studentCount = studentCountRes.data.studentCount || 0;
      const maxStudents = coachRes.data.maxStudents || 25;

      setTotalSignup(studentCount);
      setStudentLimitInfo({ current: studentCount, max: maxStudents });

      // Check if student count exceeds maxStudents
      if (studentCount > maxStudents) {
        setStudentExceeded(true);
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error("Error fetching student count:", err);
      setError("Failed to load student data.");
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      const coachId = session.user.id;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchData(coachId);
      fetchStudentCount(coachId);
    } else {
      console.log("User session is not available yet");
      // Don't set error immediately, session might still be loading
    }
  }, [session?.user?.id]); // Add proper dependency

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleUpgrade = () => {
    setSnackbarOpen(false);
    router.push("/dashboard/upgrade-plan");
  };

  const data = [
    {
      title: "Today's Bookings",
      value:
        todaysBookings !== null ? (
          `${todaysBookings}`
        ) : (
          <span className="loader"></span>
        ),
      trend: "up",
      interval: "vs yesterday",
      data: [],
    },
    {
      title: "All-Time Bookings",
      value:
        allTimeBookings !== null ? (
          `${allTimeBookings}`
        ) : (
          <span className="loader"></span>
        ),
      trend: "down",
      interval: "all time",
      data: [],
    },
    {
      title: "Total Students/Clients",
      value:
        totalSignup !== null ? (
          `${totalSignup}`
        ) : (
          <span className="loader"></span>
        ),
      trend: "neutral",
      interval: "all time",
      data: [],
    },
  ];

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="w-full h-full bg-white font-[Kanit] overflow-y-hidden">
      {/* Add internal styles for the loader */}
      <style>
        {`
          .loader {
            width: 31px;
            height: 31px;
            border: 5px solid #037D40; 
            border-bottom-color: transparent;
            border-radius: 50%;
            display: inline-block;
            box-sizing: border-box;
            animation: rotation 1s linear infinite;
          }

          @keyframes rotation {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-5 justify-center sm:justify-start items-center mt-20 mb-5">
        {data.map((card, index) => (
          <div key={index} className="w-full flex">
            <StatCard
              title={card.title}
              value={card.value}
              trend={card.trend}
              interval={card.interval}
              data={card.data}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div>
          <BookingRequestStats />
        </div>

        <div className="w-full">
          <SessionsChart />
        </div>
      </div>

      <Grid
        sx={{
          width: "100%",
          fontFamily: "Kanit, sans-serif",
          marginTop: 4,
          "@media (max-width: 1024px)": {
            flexDirection: "column",
          },
        }}
      >
        <Grid
          size={{ xs: 12, md: 9 }}
          sx={{
            width: "100%",
            mt: { xs: 4, sm: 5, md: 6 },
            height: {
              xs: "calc(100vh - 800px)",
              sm: "calc(100vh - 850px)",
              md: "calc(100vh - 900px)",
            },
            minHeight: {
              xs: "400px",
              sm: "500px",
              md: "600px",
            },
            fontFamily: "Kanit, sans-serif",
            pt: { xs: 4, sm: 3, md: 0 },
            overflow: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#555",
              },
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
              borderRadius: "4px",
            },
          }}
        >
          <CustomizedDataGrid />
        </Grid>
      </Grid>

      {/* Student Limit Exceeded Snackbar */}
      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          marginTop: "80px",
          "& .MuiSnackbarContent-root": {
            minWidth: "400px",
          },
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="warning"
          variant="filled"
          sx={{
            width: "100%",
            backgroundColor: "#D76C82",
            color: "white",
            fontFamily: "Kanit, sans-serif",
            fontSize: "14px",
            boxShadow: "0 8px 32px rgba(255, 107, 53, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            "& .MuiAlert-icon": {
              color: "white",
            },
            "& .MuiAlert-action": {
              padding: 0,
              marginRight: "-8px",
            },
            "& .MuiIconButton-root": {
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            },
          }}
          action={
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {/* <Button
                onClick={handleUpgrade}
                size="small"
                sx={{
                  backgroundColor: 'white',
                  color: '#ff6b35',
                  fontFamily: 'Kanit, sans-serif',
                  fontWeight: 600,
                  fontSize: '12px',
                  textTransform: 'none',
                  borderRadius: '6px',
                  padding: '4px 12px',
                  minWidth: 'auto',
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#f0f0f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  },
                }}
              >
                Upgrade Plan
              </Button> */}
            </Box>
          }
        >
          <Box>
            <Box sx={{ fontWeight: 600, marginBottom: "4px" }}>
              Student Limit Exceeded!
            </Box>
            <Box sx={{ fontSize: "13px", opacity: 0.9 }}>
              You have {studentLimitInfo.current} students but your plan only
              allows {studentLimitInfo.max} students.
            </Box>
          </Box>
        </Alert>
      </Snackbar>
    </div>
  );
}
