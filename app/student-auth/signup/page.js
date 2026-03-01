// app/student-auth/signup/page.js
"use client";

import React, { useState, Suspense } from "react";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import validator from "validator";
import { signIn } from "next-auth/react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StudentSignUp() {
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  // console.log("Coach ID:", coachId); // Debug log for coachId

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  // Validation functions
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
    } catch (error) {
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
    if (!conditions.length) {
      return "Password must be at least 8 characters long.";
    }
    const metConditions = Object.values(conditions).filter(Boolean).length;
    if (metConditions < 3) {
      return "Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, or special characters.";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    if (name === "password") {
      getPasswordError(value);
    }
  };

  const handlePhoneChange = (value) => {
    setFormData({ ...formData, phone: value });
    setErrors((prevErrors) => ({ ...prevErrors, phone: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setMessage("");

    // Validate coachId
    if (!coachId) {
      setErrors({ general: "Invalid or missing coach ID." });
      setIsLoading(false);
      return;
    }

    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Name is required.";
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
      const normalizedPhone = formData.phone.replace(/\D/g, ""); // Normalize phone number

      const response = await axios.post("/api/student-auth/signup", {
        ...formData,
        phone: normalizedPhone, // Send normalized phone
        coachId,
      });
      setMessage(response.data.message);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        password: "",
      });
      router.push(
        "/student-auth/login?success=Registration successful! Please log in."
      ); // Redirect to login page
    } catch (error) {
      setMessage(
        error.response?.data?.error ||
          "An error occurred during registration. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signIn("google", { callbackUrl: "/student-dashboard" });
    } catch (error) {
      setMessage("Google sign-up failed. Please try again.");
    }
  };

  return (
    <div
      className="grid place-items-center mt-20 mb-20 px-4"
      style={{
        background:
          "url('https://www.codingnepalweb.com/demos/create-glassmorphism-login-form-html-css/hero-bg.jpg') center/cover",
      }}
    >
      {/* ProgressBar */}
      <div className="w-full max-w-lg">
        <ProgressBar currentStep={1} />
      </div>
      {/* Form Container */}
      <div
        className="w-full max-w-lg p-8 sm:p-10 rounded-xl shadow-lg"
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          borderRadius: "12px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-primary">Register</h2>
        <p className="text-sm sm:text-base text-[#000000] mb-6">
          Create an account to get started
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Full Name Field */}
          <div className="w-full">
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.fullName ? "border-red-500" : "border-gray-200"
              }`}
              required
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.fullName}
              </p>
            )}
          </div>
          {/* Email Field */}
          <div className="w-full">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.email ? "border-red-500" : "border-gray-200"
              }`}
              required
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.email}
              </p>
            )}
          </div>
          {/* Phone Input Field */}
          <div className="w-full">
            <PhoneInput
              international
              value={formData.phone}
              onChange={handlePhoneChange}
              defaultCountry="au"
              placeholder="Enter your contact number"
              className={`px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.phone ? "border-red-500" : "border-gray-200"
              }`}
              inputStyle={{
                backgroundColor: "#f3f4f6",
                width: "100%",
                height: "48px",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              buttonStyle={{
                backgroundColor: "#f3f4f6",
                border: "none",
              }}
              style={{
                "--react-international-phone-border-radius": "0.5rem",
                "--react-international-phone-border-color": "transparent",
                "--react-international-phone-background-color": "#f3f4f6",
                "--react-international-phone-height": "48px",
              }}
              required
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.phone}
              </p>
            )}
          </div>
          {/* Password Field */}
          <div className="w-full">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.password ? "border-red-500" : "border-gray-200"
              }`}
              required
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.password}
              </p>
            )}
            {!errors.password && formData.password && (
              <div className="items-center text-left mt-1 justify-center">
                <p className="text-sm text-gray-600 mt-1">
                  Password must be at least 8 characters long and contain at
                  least 3 of the following:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  <li
                    style={{
                      color: passwordRequirements.length ? "green" : "gray",
                    }}
                  >
                    At least 8 characters
                  </li>
                  <li
                    style={{
                      color: passwordRequirements.lowercase ? "green" : "gray",
                    }}
                  >
                    At least one lowercase letter
                  </li>
                  <li
                    style={{
                      color: passwordRequirements.uppercase ? "green" : "gray",
                    }}
                  >
                    At least one uppercase letter
                  </li>
                  <li
                    style={{
                      color: passwordRequirements.number ? "green" : "gray",
                    }}
                  >
                    At least one number
                  </li>
                  <li
                    style={{
                      color: passwordRequirements.specialChar
                        ? "green"
                        : "gray",
                    }}
                  >
                    At least one special character
                  </li>
                </ul>
              </div>
            )}
          </div>
          {/* Address Field */}
          <div className="w-full">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.address ? "border-red-500" : "border-gray-200"
              }`}
              required
              disabled={isLoading}
            />
            {errors.address && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.address}
              </p>
            )}
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="py-3 px-6 rounded-lg text-white bg-primary hover:bg-primary-dark transition-all duration-300 w-full"
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Register"
            )}
          </button>
          {/* Error Message */}
          {message && (
            <div className="bg-red-500 text-white p-3 rounded mt-4 text-center">
              {message}
            </div>
          )}
          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignUp}
            className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 transition-transform duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 48 48"
            >
              <defs>
                <path
                  id="a"
                  d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
                />
              </defs>
              <clipPath id="b">
                <use xlinkHref="#a" overflow="visible" />
              </clipPath>
              <path clipPath="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z" />
              <path
                clipPath="url(#b)"
                fill="#EA4335"
                d="M0 11l17 13 7-6.1L48 14V0H0z"
              />
              <path
                clipPath="url(#b)"
                fill="#34A853"
                d="M0 37l30-23 7.9 1L48 0v48H0z"
              />
              <path
                clipPath="url(#b)"
                fill="#4285F4"
                d="M48 48L17 24l-4-3 35-10z"
              />
            </svg>
            <span className="ml-2">Sign up with Google</span>
          </button>
          {/* Already Have an Account Section */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/student-auth/login"
                className="text-primary font-medium hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgressBar({ currentStep }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div
        className="bg-primary h-2.5 rounded-full"
        style={{ width: `${currentStep * 33.33}%` }}
      ></div>
    </div>
  );
}

// Wrap the StudentSignUp component in a Suspense boundary
export default function StudentSignUpPage() {
  return (
    <Suspense fallback={<div>Loading signup page...</div>}>
      <StudentSignUp />
    </Suspense>
  );
}
