// components/StudentSidemenu.js
"use client";

import * as React from "react";
import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import StudentMenuContent from "./StudentMenuContent";
import Button from "@mui/material/Button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const drawerWidth = "full";

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    backgroundColor: "#ffffff",
    padding: "20px 10px",
    borderRadius: "5px 0px 0px 0px",
    overscrollBehavior: "none",
    overflowY: "auto",
    maxHeight: "100vh",
    height: "100vh",
  },
}));

export default function StudentSidemenu({ session }) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      localStorage.removeItem("studentData");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      await signOut({
        redirect: true,
        callbackUrl: "/student-auth/login",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      setIsSigningOut(false);
      alert("An error occurred while logging out. Please try again.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "5px",
          mt: 2,
        }}
      >
        {/* Profile section removed */}
      </Box>

      <div className="mt-2">
        <Divider />
      </div>

      <StudentMenuContent session={session} />

      <div className="mt-auto px-2 pb-4">
        <Box
          sx={{
            display: "flex",
            width: "100%",
            fontWeight: 700,
            fontFamily: "Kanit, sans-serif",
            borderTop: "1px solid #e0e0e0",
            pt: 1,
          }}
        >
          <Button
            startIcon={<LogOut size={20} strokeWidth={2} />}
            aria-label="Log out"
            disabled={isSigningOut}
            sx={{
              fontFamily: "Kanit, sans-serif",
              color: "#037D40",
              textTransform: "none",
              width: "100%",
              justifyContent: "flex-start",
              px: 2.5,
              py: 1.25,
              borderRadius: 0,
              fontSize: "14px",
              fontWeight: 700,
              "&:hover": {
                bgcolor: "#D1E8D5",
              },
              "&.Mui-disabled": {
                color: "#5f8f75",
              },
            }}
            onClick={handleLogout}
          >
            {isSigningOut ? "Signing out…" : "Log Out"}
          </Button>
        </Box>
      </div>
    </div>
  );
}
