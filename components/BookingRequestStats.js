"use client";
import * as React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const StyledText = styled("text")(({ theme, variant }) => ({
  textAnchor: "middle",
  dominantBaseline: "central",
  fill: "#000000",
  fontSize:
    variant === "primary"
      ? theme.typography.h5.fontSize
      : theme.typography.body2.fontSize,
  fontWeight:
    variant === "primary"
      ? theme.typography.h5.fontWeight
      : theme.typography.body2.fontWeight,
}));

function PieCenterLabel({ primaryText, secondaryText }) {
  const { width, height, left, top } = useDrawingArea();
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <React.Fragment>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </React.Fragment>
  );
}

export default function BookingRequestStats() {
  const { data: session } = useSession();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!session?.user?.id) {
          console.error("No coach ID found in session");
          return;
        }

        const response = await axios.get("/api/status", {
          params: { coachId: session.user.id },
        });

        const { total, approved, declined, pending } = response.data;

        setData([
          { label: "Approved", value: approved.count },
          { label: "Declined", value: declined.count },
          { label: "Not Reviewed", value: pending.count },
        ]);

        setStats([
          {
            value: approved.percentage,
            name: "Approved",
            color: "#037D40",
          },
          {
            value: pending.percentage,
            name: "Pending",
            color: "#8BC3A7",
          },
          {
            value: declined.percentage,
            name: "Declined",
            color: "#D50000",
          },
        ]);

        setTotalRequests(total);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchStats();
    }
  }, [session]);
  if (loading || !data || !stats) {
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
          <span className="loader"></span>
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
          sx={{
            color: "#000000",
            textAlign: "center",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          Statistics of Booking Request
        </Typography>
        <Box
          sx={{ display: "flex", alignItems: "center", justifyItems: "center" }}
        >
          <PieChart
            colors={["#037D40", "#D50000", "#8BC3A7"]}
            margin={{
              left: 80,
              right: 80,
              top: 80,
              bottom: 80,
              width: "216.78px",
              height: "216.78px",
              fontFamily: "Kanit, sans-serif",
            }}
            series={[
              {
                data,
                innerRadius: 75,
                outerRadius: 100,
                paddingAngle: 0,
                highlightScope: { faded: "global", highlighted: "item" },
              },
            ]}
            height={260}
            width={260}
            slotProps={{
              legend: { hidden: true },
            }}
          >
            <PieCenterLabel
              primaryText={`${totalRequests}`}
              secondaryText="Total Requests"
            />
          </PieChart>
        </Box>

        <Stack
          direction="row"
          spacing={5}
          sx={{ mx: 2, justifyContent: "center" }}
        >
          {stats.map((stat, index) => (
            <Box key={index} sx={{ textAlign: "center", color: stat.color }}>
              <Typography variant="body2">{stat.value}%</Typography>
              <Typography
                variant="body2"
                sx={{ color: "#757575", fontWeight: "500", fontSize: "12px" ,fontFamily: "Kanit, sans-serif",}}
              >
                {stat.name}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
