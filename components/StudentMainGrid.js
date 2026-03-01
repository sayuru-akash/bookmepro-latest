"use client";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// Simple card component to replace StatCard
const SimpleCard = ({ title, value, description }) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-5 h-36">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <div className="mt-3 text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-2 text-sm text-gray-500">{description}</div>
    </div>
  );
};

// Simple box component to replace charts
const SimpleBox = ({ height = "300px", title = "Chart Placeholder" }) => {
  return (
    <div 
      className="w-full bg-white rounded-lg shadow-md p-5"
      style={{ height }}
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="w-full h-4/5 bg-gray-100 rounded-md flex items-center justify-center">
        <p className="text-gray-400">{title} content goes here</p>
      </div>
    </div>
  );
};

export default function StudentMainGrid() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentId = "your-student-id"; // Replace with the actual student ID

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/fetch_appointment?studentId=${studentId}`);
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [studentId]);

  const cardTitles = [
    { title: "Today's Bookings", value: bookings.length, description: "Total bookings for today" },
    { title: "All-Time Bookings", value: bookings.length, description: "Total bookings" },
    { title: "Total Students", value: 1, description: "You are the only student" }
  ];

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
        {cardTitles.map((card, index) => (
          <div key={index} className="w-full flex">
            <SimpleCard title={card.title} value={card.value} description={card.description} />
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-2/5">
          <SimpleBox title="Booking Requests" />
        </div>

        <div className="w-full lg:w-3/5">
          <SimpleBox title="Sessions Chart" />
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
          <SimpleBox title="Data Grid" height="100%" />
        </Grid>
      </Grid>
    </div>
  );
}