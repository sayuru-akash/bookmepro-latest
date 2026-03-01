"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import DashboardHeader from "../../../components/DashboardHeader";
import SideMenu from "../../../components/SideMenu";
import axios from "axios";

// Dynamically import AppTheme with ssr disabled
const AppTheme = dynamic(() => import("../../../app/shared-theme/AppTheme"), {
  ssr: false,
});

export default function AdminContactPage(props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleNext = () => {
    if (formData.message.trim()) {
      setShowForm(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Please enter a message before proceeding.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("/api/contact", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setSuccessMessage(
          "Message sent successfully! We'll get back to you soon."
        );
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to send message. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <div className="flex flex-col justify-center items-center">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-t-primary border-gray-300 rounded-full animate-spin"></div>
          <div className="mt-4 text-primary text-xl font-semibold">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            paddingTop: "25px",
            paddingLeft: "20px",
            paddingRight: "20px",
            height: "82px",
            zIndex: 10,
            backgroundColor: "white",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <DashboardHeader />
        </Box>

        <Box
          sx={{
            width: "250px",
            position: "fixed",
            top: "92px",
            left: 0,
            bottom: 0,
            overflowY: "auto",
            zIndex: 5,
            backgroundColor: "#f4f4f4",
            borderRight: "1px solid #ddd",
          }}
        >
          <SideMenu session={session} />
        </Box>

        <Box
          sx={{
            paddingLeft: { md: "350px" },
            paddingTop: { xs: "60px", sm: "20px" },
            overflow: "auto",
            backgroundColor: "white",
            minHeight: "100vh",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <div className="px-6 py-6 sm:px-10 sm:py-10">
            <h1 className="font-kanit sm:text-start text-center font-bold text-[20px] sm:text-[22px] pb-5 mt-10 sm:mt-20">
              Contact Management
            </h1>

            <Box
              sx={{
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                p: 4,
                mb: 6,
              }}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-primary">
                Send a Message
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mt-2 mb-6">
                Fill in the form below to contact users and manage communication
                effectively.
              </p>

              {!showForm ? (
                <div className="flex flex-col gap-4">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full h-28 sm:h-36 border p-3 rounded-md bg-[#F4F4F4] border-[#D1D1D1] focus:outline-none"
                    placeholder="Enter your message here..."
                  />
                  <Button
                    onClick={handleNext}
                    sx={{
                      bgcolor: "#037D40",
                      fontFamily: "Kanit, sans-serif",
                      color: "white",
                      "&:hover": { bgcolor: "#025b2e" },
                      width: { xs: "100%", sm: "auto" },
                      alignSelf: { xs: "center", sm: "flex-end" },
                    }}
                  >
                    Next
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="w-full max-w-md mx-auto sm:max-w-lg"
                >
                  <div className="flex flex-col gap-4 mt-6 p-4 sm:p-6 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
                      Contact Us
                    </h2>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                      className="p-3 sm:p-4 border-2 rounded-lg bg-[#F4F4F4] border-[#D1D1D1] focus:outline-none focus:ring-2 focus:ring-[#037D40] transition duration-300"
                      required
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your Phone Number"
                      className="p-3 sm:p-4 border-2 rounded-lg bg-[#F4F4F4] border-[#D1D1D1] focus:outline-none focus:ring-2 focus:ring-[#037D40] transition duration-300"
                    />

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your Email Address"
                      className="p-3 sm:p-4 border-2 rounded-lg bg-[#F4F4F4] border-[#D1D1D1] focus:outline-none focus:ring-2 focus:ring-[#037D40] transition duration-300"
                      required
                    />

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      sx={{
                        bgcolor: "#037D40",
                        fontFamily: "Kanit, sans-serif",
                        color: "white",
                        "&:hover": { bgcolor: "#025b2e" },
                        width: "100%",
                        py: 2,
                        borderRadius: "8px",
                      }}
                    >
                      {isSubmitting ? "Sending..." : "Submit"}
                    </Button>
                  </div>
                </form>
              )}

              {successMessage && (
                <p className="text-green-600 text-center font-medium mt-4">
                  {successMessage}
                </p>
              )}
              {errorMessage && (
                <p className="text-red-600 text-center font-medium mt-4">
                  {errorMessage}
                </p>
              )}
            </Box>
          </div>
        </Box>
      </Box>
    </AppTheme>
  );
}
