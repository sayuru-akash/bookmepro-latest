"use client";

import * as React from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { LineChart } from "@mui/x-charts/LineChart";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Gradient component remains the same
function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

function getCurrentMonthDays() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const date = new Date(currentYear, currentMonth + 1, 0);
  const monthName = date.toLocaleDateString("en-US", { month: "short" });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

export default function SessionsChart() {
  const { data: session } = useSession();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const data = getCurrentMonthDays();
  const [appointmentCounts, setAppointmentCounts] = React.useState([]);

  React.useEffect(() => {
    const fetchAppointmentCounts = async () => {
      try {
        if (!session?.user?.id) {
          console.error("No coach ID found in session");
          return;
        }

        const response = await axios.get("/api/chart", {
          params: { coachId: session.user.id },
        });
        const counts = response.data.counts;
        setAppointmentCounts(counts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching appointment counts:", error);
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAppointmentCounts();
    }
  }, [session]);

  if (loading) {
    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flexGrow: 1,
          color: "#000000",
          fontFamily: "Kanit, sans-serif",
          height: "350px",
          backgroundColor: "white",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Typography
            component="h2"
            variant="subtitle2"
            sx={{ color: "#000000", textAlign: "start",fontFamily: "Kanit, sans-serif", }}
          >
            Bookings
          </Typography>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <span className="loader"></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flexGrow: 1,
        color: "#000000",
        fontFamily: "Kanit, sans-serif",
      }}
    >
      <CardContent>
        <Typography
          component="h2"
          variant="subtitle2"
          sx={{ color: "#000000", textAlign: "start" ,fontFamily: "Kanit, sans-serif",fontWeight: "bold",}}
        >
          Bookings
        </Typography>

        <Stack sx={{ justifyContent: "space-between" }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: "center", sm: "flex-start" },
              alignItems: "center",
              gap: 1,
              fontFamily: "Kanit, sans-serif",
            }}
          >
            <Typography
              variant="h4"
              component="p"
              sx={{ fontSize: { xs: "0.4rem", sm: "2rem" }, color: "black" ,fontFamily: "Kanit, sans-serif",}}
            >
              {appointmentCounts.reduce((a, b) => a + b, 0) || 0}
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: "black",
              fontSize: { xs: "0.4rem", sm: "0.75rem" },
              fontFamily: "Kanit, sans-serif",
            }}
          >
            Sessions per day for the current month
          </Typography>
        </Stack>
        <LineChart
          colors={["#037D40"]}
          xAxis={[
            {
              scaleType: "point",
              data,
              tickInterval: (index, i) => (i + 1) % 5 === 0,
            },
          ]}
          yAxis={[{ min: 0 }]}
          series={[
            {
              id: "appointments",
              label: "Appointments",
              showMark: false,
              curve: "linear",
              area: true,
              data: appointmentCounts.length ? appointmentCounts : [0],
            },
          ]}
          height={229}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          sx={{
            "& .MuiAreaElement-series-organic": {
              fill: "url('#appointments')",
            },
            fontFamily: "Kanit, sans-serif",
          }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
        >
          <AreaGradient color="#037D40" id="appointments" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
