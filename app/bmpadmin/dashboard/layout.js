// app/bpmadmin/dashboard/layout.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CircularProgress, Box, Container } from "@mui/material";
import AdminSidemenu from "../../../components/AdminSidemenu";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "loading" && (!session || session.user.role !== "admin")) {
      router.push("/bmpadmin");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Box sx={{ position: "fixed", zIndex: 99, height: "100vh" }}>
        <AdminSidemenu />
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: "100%", md: "calc(100% - 200px)" },
          marginLeft: { xs: "10px", md: "270px" }, 
          overflowX: "auto",
          position: "relative",
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 0, sm: 2 },
            width: "100%",
            maxWidth: "100% !important",
            pt: "64px",
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}