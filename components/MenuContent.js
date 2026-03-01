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
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useRouter, usePathname } from "next/navigation";

const mainListItems = [
  { text: "Dashboard", icon: <LayoutGrid />, path: "/dashboard" },
  { text: "My Bookings", icon: <Album />, path: "/dashboard/my-bookings" },
  {
    text: "My Calendar",
    icon: <CalendarDays />,
    path: "/dashboard/my-calendar",
  },
];

const secondaryListItems = [
  { text: "Contact Us", icon: <CircleAlert />, path: "/dashboard/my-contacts" },
  { text: "Settings", icon: <Settings />, path: "/dashboard/my-settings" },
];

export default function MenuContent() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const handleListItemClick = (index, path) => {
    setSelectedIndex(index);
    if (router) {
      router.push(path);
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
        <List dense>
          <div
            className="md:hidden"
            style={{
              width: "full",
              height: "18px",
              padding: "0px 8px",
              gap: "10px",
              color: textColor,
              fontSize: "14px",
              fontWeight: 700,
              textAlign: "left",
              marginBottom: "10px",
              fontFamily: "Kanit, sans-serif",
              display: isClient && window.innerWidth <= 768 ? "none" : "block",
            }}
          >
            Main Menu
          </div>
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
                      "&:hover": { bgcolor: active ? selectedBgColor : bgColorHover },
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
                    <ArrowRightIcon sx={{ fill: active ? selectedTextColor : textColor }} />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>

        <List dense>
          <div
            style={{
              width: "full",
              height: "18px",
              padding: "0px 8px",
              gap: "10px",
              color: textColor,
              fontSize: "14px",
              fontWeight: 700,
              textAlign: "start",
              marginBottom: "10px",
              fontFamily: "Kanit, sans-serif",
              display: isClient && window.innerWidth <= 768 ? "none" : "block",
            }}
          >
            Help & Support
          </div>

          {secondaryListItems.map((item, index) => {
            const active = isActive(item.path);
            return (
              <React.Fragment key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleListItemClick(index + mainListItems.length, item.path)}
                    sx={{
                      width: "full",
                      height: "full",
                      padding: "0 20px",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: active ? selectedBgColor : "transparent",
                      "&:hover": { bgcolor: active ? selectedBgColor : bgColorHover },
                      color: active ? selectedTextColor : textColor,
                      gap: "0px",
                      opacity: 1,
                      borderRadius: 0,
                    }}
                  >
                    <Box sx={{ gap: 2, display: "flex", padding: 1 }}>
                      <ListItemIcon
                        sx={{
                          width: "25px",
                          height: "25px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: active ? selectedTextColor : iconColor,
                        }}
                      >
                        {React.cloneElement(item.icon, {
                          size: 28,
                          strokeWidth: 2,
                          color: active ? selectedTextColor : iconColor,
                        })}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: "20px",
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
                    <ArrowRightIcon sx={{ fill: active ? selectedTextColor : textColor }} />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      </Stack>
    </div>
  );
}