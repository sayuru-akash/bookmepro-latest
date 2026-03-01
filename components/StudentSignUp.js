// components/StudentSignUp.js
"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  PersonOutlined,
  EmailOutlined,
  HomeOutlined,
  LockOutlined,
  PersonAddOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useParams } from "next/navigation";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import validator from "validator";

export default function StudentSignUp({ onSuccess, coachId: propCoachId }) {
  const params = useParams();
  const coachId = propCoachId || params?.coachId;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const isValidEmail = (email) => {
    if (!validator.isEmail(email)) return false;
    const commonDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
    ];
    const emailDomain = email.split("@")[1];
    return commonDomains.includes(emailDomain);
  };

  const isValidPhone = (phone) => {
    try {
      const phoneNumber = parsePhoneNumberFromString(phone);
      return phoneNumber && phoneNumber.isValid();
    } catch {
      return false;
    }
  };

  const getPasswordError = (password) => {
    const conditions = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*?&#]/.test(password),
    };
    setPasswordRequirements(conditions);
    if (!conditions.length)
      return "Password must be at least 8 characters long.";
    const metConditions = Object.values(conditions).filter(Boolean).length;
    if (metConditions < 3)
      return "Password must contain at least 3 of: uppercase, lowercase, numbers, or special characters.";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password") getPasswordError(value);
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone: value });
    setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setMessage("");

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required.";
    else if (!isValidPhone(formData.phone))
      newErrors.phone = "Please enter a valid phone number.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!isValidEmail(formData.email))
      newErrors.email = "Please enter a valid email address.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.password.trim()) newErrors.password = "Password is required.";
    else {
      const passwordError = getPasswordError(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/student/signup", {
        ...formData,
        coachId,
      });
      setMessage(response.data.message);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        password: "",
      });
      setErrors({});
      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "An error occurred.");
    } finally {
      setIsLoading(false);
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
          <PersonAddOutlined sx={{ color: "white", fontSize: 26 }} />
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
          Create Your Account
        </Typography>
        <Typography variant="caption" sx={{ color: "#6b7280" }}>
          Register to book a session with your coach
        </Typography>
      </Box>

      {/* ── Status Message ── */}
      {message && (
        <Box
          sx={{
            bgcolor: message.toLowerCase().includes("success")
              ? "#f0fdf4"
              : "#fef2f2",
            border: `1px solid ${
              message.toLowerCase().includes("success") ? "#86efac" : "#fca5a5"
            }`,
            borderRadius: 2,
            p: 1.5,
            mb: 2,
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: message.toLowerCase().includes("success")
                ? "#166534"
                : "#dc2626",
              fontFamily: "Kanit",
              fontWeight: 500,
            }}
          >
            {message}
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        {/* ── Section label: Personal Information ── */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "#037D40",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            mb: 1,
          }}
        >
          Personal Information
        </Typography>

        {/* Name */}
        <TextField
          fullWidth
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
          size="small"
          sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlined sx={{ color: "#037D40", fontSize: 18 }} />
              </InputAdornment>
            ),
            style: { borderRadius: "10px", fontFamily: "Kanit, sans-serif" },
          }}
        />

        {/* Phone */}
        <FormControl fullWidth error={!!errors.phone} sx={{ mb: 1.5 }}>
          <InputLabel
            htmlFor="phone-input"
            shrink
            sx={{ background: "white", px: 0.5, fontFamily: "Kanit" }}
          >
            Phone Number
          </InputLabel>
          <Box
            sx={{
              border: errors.phone
                ? "1px solid #d32f2f"
                : "1px solid rgba(0,0,0,0.23)",
              borderRadius: "10px",
              "&:hover": {
                borderColor: errors.phone ? "#d32f2f" : "rgba(0,0,0,0.87)",
              },
              "& .react-international-phone-country-selector-dropdown": {
                zIndex: 1500,
              },
            }}
          >
            <PhoneInput
              defaultCountry="au"
              value={formData.phone}
              onChange={handlePhoneChange}
              inputStyle={{
                backgroundColor: "white",
                width: "100%",
                height: "40px",
                border: "none",
                fontFamily: "Kanit, sans-serif",
                fontSize: "14px",
              }}
              containerStyle={{
                width: "100%",
                background: "white",
                display: "flex",
                alignItems: "center",
                borderRadius: "10px",
              }}
              buttonStyle={{
                background: "white",
                border: "none",
                borderRight: "1px solid #e5e7eb",
              }}
              style={{
                "--react-international-phone-border-radius": "10px",
                "--react-international-phone-border-color": "transparent",
                "--react-international-phone-background-color": "white",
                "--react-international-phone-height": "40px",
              }}
            />
          </Box>
          {errors.phone && (
            <FormHelperText error>{errors.phone}</FormHelperText>
          )}
        </FormControl>

        {/* Email */}
        <TextField
          fullWidth
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          size="small"
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

        {/* Address */}
        <TextField
          fullWidth
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          error={!!errors.address}
          helperText={errors.address}
          size="small"
          sx={{ mb: 0.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeOutlined sx={{ color: "#037D40", fontSize: 18 }} />
              </InputAdornment>
            ),
            style: { borderRadius: "10px", fontFamily: "Kanit, sans-serif" },
          }}
        />

        <Divider sx={{ my: 2, borderColor: "#f3f4f6" }} />

        {/* ── Section label: Security ── */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: "#037D40",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            mb: 1,
          }}
        >
          Security
        </Typography>

        {/* Password */}
        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          size="small"
          sx={{ mb: 1 }}
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

        {/* ── Password Requirements Checklist ── */}
        {!errors.password && formData.password && (
          <Box sx={{ mt: 1, mb: 1.5, textAlign: "left" }}>
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontFamily: "Kanit", mb: 0.5 }}
            >
              Password must meet the following requirements:
            </Typography>
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {[
                {
                  label: "At least 8 characters",
                  met: passwordRequirements.length,
                },
                {
                  label: "At least one lowercase letter",
                  met: passwordRequirements.lowercase,
                },
                {
                  label: "At least one uppercase letter",
                  met: passwordRequirements.uppercase,
                },
                {
                  label: "At least one number",
                  met: passwordRequirements.number,
                },
                {
                  label: "At least one special character (@$!%*?&#)",
                  met: passwordRequirements.specialChar,
                },
              ].map((req) => (
                <li
                  key={req.label}
                  style={{
                    color: req.met ? "#037D40" : "#ef4444",
                    fontFamily: "Kanit, sans-serif",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "2px",
                  }}
                >
                  <span>{req.met ? "✓" : "✗"}</span>
                  {req.label}
                </li>
              ))}
            </ul>
          </Box>
        )}

        {/* ── Submit ── */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={{
            mt: 1,
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
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} color="inherit" />
              Creating Account…
            </Box>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>
    </Box>
  );
}
