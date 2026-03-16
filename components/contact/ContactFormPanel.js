"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";

export default function ContactFormPanel() {
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  return (
    <div className="rounded-[2rem] border border-[#d8e3d8] bg-white p-7 shadow-[0_20px_55px_rgba(16,49,31,0.08)] sm:p-8">
      <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#143521]">
        How can we help you?
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {!showForm ? (
          <div className="relative">
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="h-[220px] w-full resize-none rounded-[1.25rem] border border-[#b1d7c4] bg-[#e6f2ec] p-4"
              placeholder="Your Message"
              required
            ></textarea>

            <button
              type="button"
              onClick={handleNext}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#025b2e]"
            >
              Next
              <Image
                src="/images/home/arrowHorizontal.png"
                width={18}
                height={18}
                alt="Next"
              />
            </button>
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-[#b1d7c4] bg-[#e6f2ec] p-6">
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#b1d7c4] bg-[#e6f2ec] p-3"
                placeholder="Your Name"
                required
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#b1d7c4] bg-[#e6f2ec] p-3"
                placeholder="Your Phone Number (Optional)"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-[#b1d7c4] bg-[#e6f2ec] p-3"
                placeholder="Your Email"
                required
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-3 text-white transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
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
        <p className="mt-4 text-center font-medium text-green-600">
          {successMessage}
        </p>
      )}
      {errorMessage && (
        <p className="mt-4 text-center font-medium text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
