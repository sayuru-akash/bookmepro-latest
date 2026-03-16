"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";
import { Button } from "@mui/material";
import axios from "axios";
import Header from "../../components/header";
import LoginForm from "../../components/LoginForm";

export default function MyContactPage() {
  const { status } = useSession();
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
  const [isMobile, setIsMobile] = useState(false);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [billingCycle, setBillingCycle] = useState("monthly");

  // Define pricing plans
  const plans = [
    {
      name: "Starter",
      description: "For 1-25 Students",
      prices: {
        monthly: { amount: 10, label: "/mo" },
        quarterly: { amount: 25, label: "Quarterly" },
        yearly: { amount: 90, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=starter", // legacy link, now replaced by dynamic query params
    },
    {
      name: "Growth",
      description: "For 26-50 Students",
      prices: {
        monthly: { amount: 15, label: "/mo" },
        quarterly: { amount: 40, label: "Quarterly" },
        yearly: { amount: 120, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=growth",
    },
    {
      name: "Pro",
      description: "For 51-100 Students",
      prices: {
        monthly: { amount: 20, label: "/mo" },
        quarterly: { amount: 50, label: "Quarterly" },
        yearly: { amount: 150, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=pro",
    },
    {
      name: "Enterprise",
      description: "For 100+ Students",
      prices: {
        monthly: { amount: 25, label: "/mo" },
        quarterly: { amount: 60, label: "Quarterly" },
        yearly: { amount: 200, label: "Yearly" },
      },
      signupLink: "/auth/signup?plan=enterprise",
    },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear messages when user starts typing
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

    // Form validation
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    // Email validation
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
          "Message sent successfully! We'll get back to you soon.",
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
          "Failed to send message. Please try again later.",
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
    <>
      <Header openPlanModal={() => setPlanModalOpen(true)} />
      <section className="relative bg-white pt-20 md:pt-24 lg:pt-32">
        <div className="absolute inset-0">
          <Image
            src="/images/contact/bg.png"
            alt="Background Image"
            fill
            className="object-cover z-0"
          />
        </div>

        <div className="relative z-5 container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-24">
          {/* Header Section */}
          <div className="text-black text-center max-w-4xl mx-auto mb-6 md:mb-10">
            <div className="text-lg sm:text-xl md:text-2xl">Contact Us</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-6">
              Get In Touch
            </h1>
            {/* <p className="text-lg sm:text-xl md:text-2xl font-normal">
            Contact Us if you need any support
          </p> */}
          </div>

          {/* Quick Support Section */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-black text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8">
              Need Quick Support?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Contact Cards */}
              <div className="bg-primary text-white p-6 rounded-lg flex items-center gap-4">
                <FaPhoneAlt className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="text-xl sm:text-2xl font-normal">Phone:</h3>
                  <p className="text-lg sm:text-xl font-normal">+61430781188</p>
                </div>
              </div>

              <div className="bg-primary text-white p-6 rounded-lg flex items-center gap-4">
                <FaPhoneAlt className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="text-xl sm:text-2xl font-normal">WhatsApp:</h3>
                  <p className="text-lg sm:text-xl font-normal">+61430781188</p>
                </div>
              </div>

              <div className="bg-primary text-white p-6 rounded-lg flex items-center gap-4 sm:col-span-2 lg:col-span-1">
                <FaEnvelope className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="text-xl sm:text-2xl font-normal">Email:</h3>
                  <p className="text-lg sm:text-xl font-normal break-all">
                    info@bookmepro.com.au
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-black my-12 sm:my-16"></div>

          {/* Contact Form Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl text-black font-bold text-center mb-8">
              How can we help you?
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {!showForm ? (
                <div className="relative">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full h-[200px] md:h-[300px] rounded-lg border bg-[#E6F2EC] border-[#B1D7C4] p-4 resize-none"
                    placeholder="Your Message"
                    required
                  ></textarea>

                  <Button
                    sx={{
                      position: "absolute",
                      bottom: "16px",
                      right: "16px",
                      bgcolor: "#037D40",
                      color: "white",
                      px: 2,
                      py: 0.5,
                      "&:hover": { bgcolor: "#025b2e" },
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                    size="small"
                    onClick={handleNext}
                  >
                    Next
                    <div className="w-6">
                      <Image
                        src="/images/home/arrowHorizontal.png"
                        width={24}
                        height={24}
                        alt="Next"
                      />
                    </div>
                  </Button>
                </div>
              ) : (
                <div className="bg-[#E6F2EC] border border-[#B1D7C4] rounded-lg p-6">
                  <div className="space-y-4">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-[#E6F2EC] border border-[#B1D7C4] rounded-lg p-3"
                      placeholder="Your Name"
                      required
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-[#E6F2EC] border border-[#B1D7C4] rounded-lg p-3"
                      placeholder="Your Phone Number (Optional)"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-[#E6F2EC] border border-[#B1D7C4] rounded-lg p-3"
                      placeholder="Your Email"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full bg-primary text-white rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Submit"}
                      <Image
                        src="/images/home/arrowHorizontal.png"
                        width={20}
                        height={20}
                        alt="Submit"
                      />
                    </button>
                  </div>
                </div>
              )}
            </form>

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
          </div>
        </div>
      </section>
    </>
  );
}
