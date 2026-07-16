"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, CircularProgress, Paper } from "@mui/material";
import { useSearchParams } from "next/navigation";
import StudentSignUp from "../../../components/StudentSignUp";

function StudentSignupContent() {
  const coachId = useSearchParams().get("coachId");
  const [created, setCreated] = useState(false);

  return (
    <main className="min-h-screen bg-[#f4f7f5] grid place-items-center px-4 py-16">
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 560,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          border: "1px solid #dce8e0",
        }}
      >
        {!coachId ? (
          <Alert severity="error">
            This signup link is missing its coach. Return to the coach&apos;s
            booking page and try again.
          </Alert>
        ) : created ? (
          <Box sx={{ textAlign: "center" }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Account created. Check your email and verify it before signing
              in.
            </Alert>
            <Button
              component={Link}
              href="/student-auth/login"
              variant="contained"
              sx={{ bgcolor: "#037D40", textTransform: "none" }}
            >
              Go to student login
            </Button>
          </Box>
        ) : (
          <StudentSignUp
            coachId={coachId}
            onSuccess={() => setCreated(true)}
          />
        )}
      </Paper>
    </main>
  );
}

export default function StudentSignupPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <CircularProgress sx={{ color: "#037D40" }} />
        </Box>
      }
    >
      <StudentSignupContent />
    </Suspense>
  );
}
