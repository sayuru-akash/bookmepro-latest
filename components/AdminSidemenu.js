// components/AdminSidemenu.js
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Box, SwipeableDrawer, IconButton, Typography, useMediaQuery, useTheme, Avatar, Stack, } from "@mui/material";
import { signOut } from "next-auth/react";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const DRAWER_WIDTH = 280;

export default function AdminSidemenu() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile); // Initialize based on screen size

  // Adjust drawer state when isMobile changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const handleNavigation = (path) => {
    router.push(path);
    if (isMobile) {
      closeDrawer();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (path) => {
    return pathname === path;
  };

  const menuItems = [
    {
      text: "Student Management",
      path: "/bmpadmin/dashboard/student",
      icon: <SchoolIcon />,
    },
    {
      text: "Coach Management",
      path: "/bmpadmin/dashboard/coach",
      icon: <PersonIcon />,
    },
    {
      text: "Booking Management",
      path: "/bmpadmin/dashboard/booking",
      icon: <PeopleIcon />, 
    },
  ];

  const drawerContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "Kanit, sans-serif",
        backgroundColor: "#ffffff",
      }}
    >
      {/* Admin Profile Section */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#037D40",
            width: 48,
            height: 48,
          }}
        >
          <AdminPanelSettingsIcon />
        </Avatar>
        <Stack>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: "#037D40",
              fontFamily: "Kanit, sans-serif",
            }}
          >
            Admin
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#666",
              fontFamily: "Kanit, sans-serif",
            }}
          >
            Administrator
          </Typography>
        </Stack>
      </Box>

      {/* Header for Mobile (inside drawer) */}
      {isMobile && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: "Kanit, sans-serif",
              color: "#037D40",
              fontWeight: 600,
            }}
          >
            Admin Panel
          </Typography>
          <IconButton onClick={closeDrawer}>
          </IconButton>
        </Box>
      )}

      {/* Menu Items */}
      <List sx={{ pt: isMobile ? 0 : 1, flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.path}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)} // Using selected prop for better semantics
                sx={{
                  py: 1.5,
                  borderRadius: "8px",
                  mb: 0.5,
                  fontFamily: "Kanit, sans-serif",
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    backgroundColor: "rgba(3, 125, 64, 0.1)",
                    color: "#037D40",
                    "&:hover": {
                      backgroundColor: "rgba(3, 125, 64, 0.15)",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "rgba(3, 125, 64, 0.08)",
                    color: "#037D40",
                  },
                  color: isActive(item.path) ? "#037D40" : "#333", // Keep explicit color for non-selected icon
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? "#037D40" : "#666",
                    minWidth: "40px",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: isActive(item.path) ? 600 : 400,
                    fontFamily: "Kanit, sans-serif",
                  }}
                />
                {isActive(item.path) && (
                  <Box
                    sx={{
                      width: "4px",
                      height: "24px",
                      backgroundColor: "#037D40",
                      position: "absolute",
                      right: 0,
                      borderRadius: "4px 0 0 4px",
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 0.5, opacity: 0.3 }} />
          </React.Fragment>
        ))}
      </List>

      {/* Logout Button */}
      <Box sx={{ mt: "auto", p: 1 }}>
        <Divider sx={{ mb: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              py: 1.5,
              borderRadius: "8px",
              color: "#037D40",
              fontFamily: "Kanit, sans-serif",
              "&:hover": {
                backgroundColor: "rgba(3, 125, 64, 0.1)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#037D40", minWidth: "40px" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "Kanit, sans-serif",
              }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Toggle Button (Hamburger/Close icon) */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label={drawerOpen ? "close drawer" : "open drawer"}
          edge="start"
          onClick={drawerOpen ? closeDrawer : openDrawer}
          sx={{
            position: "fixed",
            top: "15px",
            left: drawerOpen ? `${DRAWER_WIDTH + 10}px` : "10px",
            zIndex: theme.zIndex.modal + 1,
            backgroundColor: "#037D40",
            color: "white",
            "&:hover": {
              backgroundColor: "#036b34",
            },
            transition: theme.transitions.create("left", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          }}
        >
          {drawerOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      )}

      {/* The Sidebar/Drawer Itself */}
      <SwipeableDrawer
        variant={isMobile ? "temporary" : "permanent"}
        open={drawerOpen}
        onClose={closeDrawer} 
        onOpen={openDrawer}   
        disableBackdropTransition={!isMobile} 
        disableDiscovery={isMobile}
        ModalProps={{
          keepMounted: true, 
        }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            ...(!isMobile && {
              position: "relative",
              top: "92px", 
              height: "calc(100vh - 92px)", 
            }),

            ...(isMobile && {
              top: 0,
              height: "100%",
            }),
            backgroundColor: "#ffffff", 
            borderRight: isMobile ? "none" : "1px solid #e0e0e0", 
            boxShadow: isMobile ? "2px 0 8px rgba(0,0,0,0.1)" : "none",
          },
        }}
      >
        {drawerContent}
      </SwipeableDrawer>
    </>
  );
}