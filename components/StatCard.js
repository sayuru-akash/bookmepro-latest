// components/StatCard.js
import * as React from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { areaElementClasses } from "@mui/x-charts/LineChart";
import Image from "next/image";
import { FileText ,Mail, TrendingUp} from "lucide-react";
import { CircleChevronRight } from "lucide-react";
import { Album } from "lucide-react";
import axios from 'axios';
import { useSession } from "next-auth/react";

function getDaysInMonth(month, year) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString("en-US", {
    month: "short",
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

function StatCard({ title, value, interval, trend, data }) {
  const theme = useTheme();

  const trendColors = {
    up: theme.palette.success.main,
    down: theme.palette.error.main,
    neutral: theme.palette.grey[400],
  };

  const trendIcons = {
    up: (
      <TrendingUp
        width={40} 
        height={40} 
        style={{ fill: "#037D40", stroke: "white" }} 
      />
    ),
    down: (
      <FileText
        width={40}
        height={40}
        style={{ fill: "#037D40", stroke: "white" }}
      />
    ),
    neutral: (
      <Mail 
        width={40}
        height={40}
        style={{ fill: "#037D40", stroke: "white" }}
      />
    ),
  };

  const labelColors = {
    up: "success",
    down: "error",
    neutral: "default",
  };

  return (
    <Card sx={{ height: "100%", flexGrow: 1 }}>
      <CardContent>
      <Box
          sx={{
            display: "flex",
            justifyContent: "space-between", 
            alignItems: "center",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              component="h2"
              variant="subtitle2"
              gutterBottom
              sx={{
                color: "#545454",
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontFamily: "Kanit, sans-serif",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {title}
              <CircleChevronRight
                sx={{
                  width: "18px",
                  height: "18px",
                  fill: "#545454",
                  display: { xs: "none", sm: "none", md: "inline" },
                }}
              />
            </Typography>
          </Box>

          
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end", 
              alignItems: "center",
            }}
          >
            {trendIcons[trend]}
          </Box>
        </Box>

        <Stack
          direction="column"
          sx={{
            justifyContent: "space-between",
            flexGrow: "1",
            gap: 1,
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <Stack sx={{ justifyContent: "space-between" }}>
            <Box>
              <Stack
                direction="row"
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontFamily: "Kanit, sans-serif",
                }}
              >
                <Typography
                  variant="h4"
                  component="p"
                  sx={{
                    color: "#037D40",
                    fontFamily: "Kanit, sans-serif",
                    fontSize: "31px",
                  }}
                >
                  {value}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number).isRequired,
  interval: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(["down", "neutral", "up"]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};


export default StatCard;