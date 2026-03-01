// app/student-auth/login/StudentLoginForm.js

"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSearchParams } from "next/navigation";

function StudentLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("success");

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        // If user is already logged in, redirect to dashboard
        router.push("/student-dashboard");
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        // Clear invalid storage data
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
  }, [router]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});
    setIsLoading(true);

    // Validate form data
    const validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      validationErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      validationErrors.email = "Please enter a valid email.";
    }

    if (!formData.password) {
      validationErrors.password = "Password is required.";
    }

    // If there are validation errors, stop here
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Authenticate the user via your API endpoint
      const response = await axios.post("/api/student-auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = response.data;

      if (token && user) {
        // Store the token in localStorage or cookies
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user)); // Store user data

        // Redirect to student dashboard automatically
        router.push("/student-dashboard");
      } else {
        setMessage("Failed to authenticate. Please try again.");
      }
    } catch (error) {
      console.error("Unexpected error during login:", error);
      setMessage(
        error.response?.data?.error || "An unexpected error occurred."
      );
    } finally {
      setIsLoading(false);
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
        <h2 className="text-xl sm:text-2xl font-bold text-primary">Login</h2>
        <p className="text-sm sm:text-base text-[#000000] mb-6">
          Enter your details to log in.
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500 text-white p-3 rounded mb-4 text-center">
            {successMessage}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Email Field */}
          <div className="w-full">
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter your email"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.email ? "border-red-500" : "border-gray-200"
              }`}
              required
            />
            {errors.email && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="w-full">
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter your password"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                errors.password ? "border-red-500" : "border-gray-200"
              }`}
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm text-left mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="py-3 px-6 rounded-lg text-white bg-primary hover:bg-primary-dark transition-all duration-300 w-full flex justify-center items-center"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Login"
            )}
          </button>

          {/* Error Message */}
          {message && (
            <div className="bg-red-500 text-white p-3 rounded mt-4 text-center">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default StudentLoginForm;
