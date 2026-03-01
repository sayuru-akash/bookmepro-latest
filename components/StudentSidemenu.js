// components/StudentSidemenu.js
"use client";

import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import StudentMenuContent from "./StudentMenuContent";
import Button from "@mui/material/Button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const theme = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({
        redirect: false,
      });
      localStorage.removeItem("studentData");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
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

      <div className="flex justify-center mt-auto pb-4">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            fontWeight: 700,
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <Button
            startIcon={
              <LogOut
                sx={{ fill: theme.palette.text.primary, padding: "5px" }}
              />
            }
            aria-label="Log out"
            sx={{
              fontFamily: "Kanit, sans-serif",
              color: "#037D40",
              textTransform: "none",
              display: "flex",
              alignItems: "center",
              opacity: 0.8,
              "&:hover": {
                bgcolor: "#E6F2EC",
              },
            }}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </Box>
      </div>
    </div>
  );
}
