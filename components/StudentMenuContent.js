// components/StudentMenuContent.js
"use client";

import React, { useEffect, useState } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import { Album } from "lucide-react";
import { CalendarDays } from "lucide-react";
import { Settings } from "lucide-react";
import { LayoutGrid } from "lucide-react";
import { CircleAlert } from "lucide-react";
import { User } from "lucide-react";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useRouter, usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";

const mainListItems = [
  { text: "Dashboard", icon: <LayoutGrid />, path: "/student-dashboard" },
  {
    text: "My Profile",
    icon: <Album />,
    path: "/student-dashboard/my-profile",
  },
];

export default function MenuContent() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    // Get student data from localStorage
    const storedUser = localStorage.getItem("studentData");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setStudentData(userData);
      } catch (error) {
        console.error("Error parsing stored user data:", error);
      }
    }
  }, []);

  const handleListItemClick = (index, path) => {
    setSelectedIndex(index);
    if (router) {
      router.push(path);
    }
  };

  const handleCoachProfileClick = () => {
    if (studentData && studentData.coachId) {
      router.push(`/coach/${studentData.coachId}`);
    } else {
      console.error("No coach ID found");
      // Could display a toast or notification here
    }
  };

  const textColor = "#037D40";
  const iconColor = "#037D40";
  const bgColorHover = "#D1E8D5";
  const selectedBgColor = "#D1E8D5";
  const selectedTextColor = "#037D40";

  const isActive = (path) => pathname === path;

  return (
    <div className="flex justify-center md:justify-normal">
      <Stack
        sx={{
          width: "297px",
          height: "auto",
          gap: { xs: 0, md: "5px" },
          flexGrow: 1,
          p: 1,
          justifyContent: "space-between",
          fontFamily: "Kanit, sans-serif",
        }}
      >
        {/* Student Profile Info Section */}
        {studentData && (
          <Box
            sx={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
              marginBottom: "10px",
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: textColor,
                marginBottom: "8px",
              }}
            >
              {studentData.name ? studentData.name.charAt(0) : "S"}
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: "bold",
                color: textColor,
                fontFamily: "Kanit, sans-serif",
              }}
            >
              {studentData.name || "Studenta"}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#555",
                fontFamily: "Kanit, sans-serif",
                marginBottom: "10px",
              }}
            >
              {studentData.email || ""}
            </Typography>
            {studentData.coachId && (
              <ListItemButton
                onClick={handleCoachProfileClick}
                sx={{
                  width: "100%",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  bgcolor: bgColorHover,
                  "&:hover": { bgcolor: selectedBgColor },
                  color: textColor,
                  justifyContent: "center",
                  marginTop: "4px",
                }}
              >
                <User size={16} style={{ marginRight: "8px" }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "medium",
                    fontFamily: "Kanit, sans-serif",
                  }}
                >
                  View Coach Profile
                </Typography>
              </ListItemButton>
            )}
          </Box>
        )}

        <List dense>
          {mainListItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleListItemClick(index, item.path)}
                    sx={{
                      width: "full",
                      height: "full",
                      padding: "0 20px",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: active ? selectedBgColor : "inherit",
                      "&:hover": {
                        bgcolor: active ? selectedBgColor : bgColorHover,
                      },
                      color: active ? selectedTextColor : textColor,
                      gap: "0px",
                      opacity: 1,
                      borderRadius: 0,
                    }}
                  >
                    <Box sx={{ gap: 2, display: "flex", padding: 1 }}>
                      <ListItemIcon
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: active ? selectedTextColor : iconColor,
                        }}
                      >
                        {React.cloneElement(item.icon, {
                          size: 20,
                          strokeWidth: 2,
                          color: active ? selectedTextColor : iconColor,
                        })}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: "14px",
                            fontWeight: "bold",
                            lineHeight: "21.6px",
                            textAlign: "left",
                            color: active ? selectedTextColor : textColor,
                            fontFamily: "Kanit, sans-serif",
                          },
                        }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      />
                    </Box>
                    <ArrowRightIcon
                      sx={{ fill: active ? selectedTextColor : textColor }}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>

        <List dense></List>
      </Stack>
    </div>
  );
}
