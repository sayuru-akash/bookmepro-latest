//component/StudentLogin.js
"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  LockOutlined,
  EmailOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { signIn, useSession } from "next-auth/react";

export default function StudentLogin({ onSuccess, coachId }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});

    const validationErrors = {};
    if (!formData.email) validationErrors.email = "Email is required";
    if (!formData.password) validationErrors.password = "Password is required";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // use signIn from next-auth to handle login
      const result = await signIn("student-credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        setMessage(result.error);
        if (result.error === "Invalid password.") {
          setErrors({
            email: "Invalid credentials",
            password: "Invalid credentials",
          });
        } else {
          setErrors({ email: "Invalid credentials" });
        }
      }

      if (result?.ok) {
        const user = {
          id: result?.user?.id,
          email: result?.user?.email,
          name: result?.user?.name,
          role: "student",
        };
        localStorage.setItem("token", result?.token);
        localStorage.setItem("user", JSON.stringify(user));
        if (onSuccess) onSuccess(user);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed.";
      setMessage(errorMessage);

      if (error.response?.status === 401) {
        setErrors({
          email: "Invalid credentials",
          password: "Invalid credentials",
        });
      }
    }
  };

  return (
    <Box sx={{ width: "100%", fontFamily: "Kanit, sans-serif" }}>
      {/* ── Header ── */}
      <Box sx={{ textAlign: "center", mb: 2.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            bgcolor: "#037D40",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
            boxShadow: "0 4px 14px rgba(3,125,64,0.25)",
          }}
        >
          <LockOutlined sx={{ color: "white", fontSize: 24 }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontFamily: "Kanit",
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.2,
          }}
        >
          Welcome Back
        </Typography>
        <Typography variant="caption" sx={{ color: "#6b7280" }}>
          Sign in to book your session
        </Typography>
      </Box>

      {/* ── Error Message ── */}
      {message && (
        <Box
          sx={{
            bgcolor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 2,
            p: 1.5,
            mb: 2,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#dc2626", fontFamily: "Kanit", fontWeight: 500 }}
          >
            {message}
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <TextField
          fullWidth
          label="Email Address"
          name="email"
          type="email"
          variant="outlined"
          size="small"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlined sx={{ color: "#037D40", fontSize: 18 }} />
              </InputAdornment>
            ),
            style: { borderRadius: "10px", fontFamily: "Kanit, sans-serif" },
          }}
        />

        {/* Password */}
        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          size="small"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          sx={{ mb: 0.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined sx={{ color: "#037D40", fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((p) => !p)}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <VisibilityOff fontSize="small" sx={{ color: "#9ca3af" }} />
                  ) : (
                    <Visibility fontSize="small" sx={{ color: "#9ca3af" }} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
            style: { borderRadius: "10px", fontFamily: "Kanit, sans-serif" },
          }}
        />

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            py: 1.25,
            borderRadius: "10px",
            backgroundColor: "#037D40",
            "&:hover": { backgroundColor: "#02692D" },
            fontFamily: "Kanit, sans-serif",
            fontWeight: 700,
            fontSize: 15,
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(3,125,64,0.3)",
          }}
        >
          Sign In
        </Button>
      </form>
    </Box>
  );
}
