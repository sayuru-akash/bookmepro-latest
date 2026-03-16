"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaPhoneAlt,
  FaEnvelope,
} from "react-icons/fa";
import axios from "axios";

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
    <main className="bg-[#f5f1e8] text-[#10311f]">
      <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
        <div className="absolute inset-0">
          <Image
            src="/images/contact/bg.png"
            alt="Background pattern"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(245,241,232,0.94)_20%,rgba(245,241,232,0.78)_60%,rgba(245,241,232,0.95)_100%)]" />
        </div>

        <div className="container relative mx-auto px-6 md:px-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-[#cddfcf] bg-[#edf5ef] px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-[#4d6f58]">
              Contact BookMePro
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-[#143521] sm:text-5xl lg:text-6xl">
              Let&apos;s make your booking experience cleaner, faster, and easier to trust.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#365542] sm:text-xl">
              Whether you need support, have a product question, or want to
              discuss your workflow, our team is ready to help.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-[#d8e3d8] bg-[#10311f] p-6 text-white shadow-[0_16px_45px_rgba(16,49,31,0.2)]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <FaPhoneAlt className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">Phone</h2>
              <a
                href="tel:+61430781188"
                className="mt-2 inline-block text-lg text-white/90 underline-offset-4 hover:underline"
              >
                +61430781188
              </a>
            </div>

            <div className="rounded-[1.5rem] border border-[#d8e3d8] bg-[#184e31] p-6 text-white shadow-[0_16px_45px_rgba(16,49,31,0.16)]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/12">
                <FaPhoneAlt className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">WhatsApp</h2>
              <a
                href="https://wa.me/61430781188"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-lg text-white/90 underline-offset-4 hover:underline"
              >
                +61430781188
              </a>
            </div>

            <div className="rounded-[1.5rem] border border-[#d8e3d8] bg-white p-6 text-[#163322] shadow-[0_16px_45px_rgba(16,49,31,0.08)]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e6f2ec]">
                <FaEnvelope className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Email</h2>
              <a
                href="mailto:info@bookmepro.com.au"
                className="mt-2 inline-block break-all text-lg underline-offset-4 hover:underline"
              >
                info@bookmepro.com.au
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-6 md:px-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] border border-[#d8e3d8] bg-white p-7 shadow-[0_20px_55px_rgba(16,49,31,0.08)] sm:p-8">
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-[#143521]">
                Need quick support?
              </h2>
              <p className="mt-4 text-base leading-7 text-[#365542]">
                Reach us on phone, WhatsApp, or email for urgent inquiries.
                For detailed requests, use the form and we will get back to you
                as soon as possible.
              </p>

              <div className="mt-8 rounded-[1.5rem] border border-[#d8e3d8] bg-[#fbfaf6] p-5">
                <h3 className="text-lg font-semibold text-[#143521]">
                  Follow us
                </h3>
                <div className="mt-4 flex items-center gap-4 text-primary">
                  <a
                    href="https://facebook.com/bookmepro.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f2ec] transition-colors hover:bg-[#d2e7da]"
                  >
                    <FaFacebookF className="h-4 w-4" />
                  </a>
                  <a
                    href="https://facebook.com/bookmeprosl/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f2ec] transition-colors hover:bg-[#d2e7da]"
                  >
                    <FaFacebookF className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/rizvi-wahid-3ba6b332/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f2ec] transition-colors hover:bg-[#d2e7da]"
                  >
                    <FaLinkedinIn className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </section>
    </main>
  );
}
