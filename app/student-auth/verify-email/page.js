"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

function VerificationContent() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState(() =>
    token
      ? { loading: true, ok: false, message: "Verifying your email…" }
      : {
          loading: false,
          ok: false,
          message: "This verification link is incomplete.",
        },
  );
  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/student/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => ({
        ok: response.ok,
        data: await response.json(),
      }))
      .then(({ ok, data }) =>
        setState({ loading: false, ok, message: data.message }),
      )
      .catch(() =>
        setState({
          loading: false,
          ok: false,
          message: "Verification failed. Please try again.",
        }),
      );
  }, [token]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f7f5",
        display: "grid",
        placeItems: "center",
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          textAlign: "center",
          border: "1px solid #dce8e0",
        }}
      >
        {state.loading ? (
          <CircularProgress sx={{ color: "#037D40" }} />
        ) : state.ok ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 58, color: "#037D40" }} />
        ) : (
          <ErrorOutlineIcon sx={{ fontSize: 58, color: "#b42318" }} />
        )}
        <Typography
          variant="h4"
          sx={{ mt: 2, fontFamily: "Kanit", fontWeight: 700 }}
        >
          {state.loading
            ? "Verifying email"
            : state.ok
              ? "Email verified"
              : "Verification problem"}
        </Typography>
        <Typography
          sx={{ mt: 1.5, color: "text.secondary", fontFamily: "Kanit" }}
        >
          {state.message}
        </Typography>
        {!state.loading && (
          <Button
            component={Link}
            href="/student-auth/login"
            variant="contained"
            sx={{
              mt: 3,
              bgcolor: "#037D40",
              textTransform: "none",
              fontFamily: "Kanit",
              "&:hover": { bgcolor: "#02692D" },
            }}
          >
            Go to student login
          </Button>
        )}
      </Paper>
    </Box>
  );
}

export default function VerifyStudentEmailPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "#f4f7f5",
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress sx={{ color: "#037D40" }} />
        </Box>
      }
    >
      <VerificationContent />
    </Suspense>
  );
}
