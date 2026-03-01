// components/header.js
"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiOutlineMenuAlt3, HiX } from "react-icons/hi";
import LoginForm from "../components/LoginForm";
import { useLocationPricing } from "../app/hooks/useLocationPricing";

export default function Header({ initialCountryCode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [showBookingMessage, setShowBookingMessage] = useState(false);
  const openPlanModal = () => setPlanModalOpen(true);
  // --- CHANGE: State for billing cycle remains, but it will drive the hook ---
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Add a new state to hold the full price details for ALL plans
  const [priceDetails, setPriceDetails] = useState({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // --- CHANGE: Use custom hook to get all pricing logic ---
  // It's initialized with the server-rendered country code to prevent flicker.
  const { countryCode, getAllPlansWithPricing, formatPrice } =
    useLocationPricing(initialCountryCode);

  // --- CHANGE: Get the dynamically priced plans from the hook ---
  // This will re-run whenever `billingCycle` changes.
  const plans = getAllPlansWithPricing(billingCycle);

  // This effect now fetches all prices for the selected cycle and country
  useEffect(() => {
    // Don't fetch until the countryCode is determined
    if (!billingCycle || !countryCode) return;

    const fetchAllPackagesForCycle = async () => {
      setIsLoadingPrices(true);
      try {
        // We'll create a new API route for this batch fetch for efficiency
        const response = await fetch(
          `/api/packages?&billingCycle=${billingCycle}&countryCode=${countryCode}`
        );
        const data = await response.json();

        if (response.ok) {
          // The API will return an object like { starter: {...}, growth: {...} }
          setPriceDetails(data);
        } else {
          console.error("Error fetching packages:", data.message);
          setPriceDetails({}); // Clear old prices on error
        }
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchAllPackagesForCycle();
  }, [billingCycle, countryCode]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLoginSignupClick = () => {
    if (pathname.startsWith("/coach/")) {
      setShowBookingMessage(true);
    } else {
      openPlanModal();
    }
  };

  const getActiveStyle = (linkPath) => {
    const isActive = pathname === linkPath;
    return isActive
      ? `border-b-2 ${linkPath === "/" ? "border-white" : "border-[#037D40]"}`
      : "";
  };

  // User has access if paymentStatus is active or role is trialing.
  const hasAccess =
    (session?.user?.paymentStatus === "active" ||
      session?.user?.paymentStatus === "trialing") &&
    session?.user?.role === "coach";

  return (
    <>
      <section>
        <div
          className={`${
            isHomePage && !menuOpen
              ? "bg-transparent absolute"
              : `${
                  isScrolled
                    ? "bg-white/70 backdrop-blur-md shadow-md"
                    : "bg-white shadow-md"
                }`
          } w-full fixed top-0 z-50 transition duration-300 ease-in-out`}
        >
          <div className="container mx-auto px-6 md:px-20">
            <div className="flex justify-between items-center py-4">
              <div
                className={`text-3xl font-extrabold ${
                  isHomePage ? "text-white" : "text-primary"
                }`}
              >
                <Link href="/">
                  <div className="w-36 md:w-48">
                    <Image
                      src={
                        isHomePage
                          ? "/images/home/logo 2.png"
                          : "/images/home/logo 1.png"
                      }
                      width={1000}
                      height={500}
                      alt="logo"
                    />
                  </div>
                </Link>
              </div>

              {/* Hamburger Menu for Mobile */}
              <div className="lg:hidden">
                <button onClick={toggleMenu} aria-label="Toggle menu">
                  {menuOpen ? (
                    <HiX className="text-3xl text-primary" />
                  ) : (
                    <HiOutlineMenuAlt3 className="text-3xl text-primary" />
                  )}
                </button>
              </div>

              {/* Navigation Links for Desktop */}
              <div className="hidden lg:flex items-center gap-12 text-lg">
                <div
                  className={`flex items-center gap-12 ${
                    isHomePage ? "text-white" : "text-primary"
                  }`}
                >
                  <Link
                    className={`text-xl font-normal ${getActiveStyle("/")}`}
                    href="/"
                  >
                    Home
                  </Link>
                  <Link
                    className={`text-xl font-normal ${getActiveStyle("/about")}`}
                    href="/about"
                  >
                    About
                  </Link>
                  <Link
                    className={`text-xl font-normal ${getActiveStyle(
                      "/contact"
                    )}`}
                    href="/contact"
                  >
                    Contact
                  </Link>
                </div>

                {status === "loading" ? (
                  <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : // need to check payment status and role
                session && hasAccess ? (
                  <Link
                    href="/dashboard"
                    className="bg-primary text-white flex gap-3 items-center py-2 px-6 rounded-lg font-semibold
                                    shadow-md hover:shadow-lg hover:-translate-y-0.5
                                    transform transition-all duration-300 ease-in-out
                                    focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
                  >
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        alt="profile"
                      />
                    </div>
                    <span>Dashboard</span>
                  </Link>
                ) : session?.user?.role === "student" ? (
                  <Link
                    href="/student-dashboard"
                    className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                  >
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        alt="profile"
                      />
                    </div>
                    <span className="text-xl font-normal">
                      Student Dashboard
                    </span>
                  </Link>
                ) : session?.user?.role === "admin" ? (
                  <Link
                    href="/bmpadmin/dashboard"
                    className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                  >
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        alt="profile"
                      />
                    </div>
                    <span className="text-xl font-normal">
                      Admin Dashboard
                    </span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      handleLoginSignupClick();
                    }}
                    className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                  >
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        
                        alt="profile"
                      />
                    </div>
                    <span className="text-xl font-normal">Login / Signup</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
              <div className="flex flex-col items-center gap-6 text-lg mt-4 pb-4 lg:hidden text-primary">
                <Link
                  href="/"
                  onClick={toggleMenu}
                  className={`text-xl font-normal ${getActiveStyle("/")}`}
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  onClick={toggleMenu}
                  className={`text-xl font-normal ${getActiveStyle("/about")}`}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  onClick={toggleMenu}
                  className={`text-xl font-normal ${getActiveStyle(
                    "/contact"
                  )}`}
                >
                  Contact
                </Link>
                {status === "loading" ? (
                  <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                ) : session && hasAccess ? (
                  <button
                    className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                    onClick={toggleMenu}
                  >
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        
                        alt="profile"
                      />
                    </div>
                    <Link href="/dashboard">Dashboard</Link>
                  </button>
                ) : session?.user?.role === "student" ? (
                  <button className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded">
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        
                        alt="profile"
                      />
                    </div>
                    <Link href="/student-dashboard">
                      <span className="text-xl font-normal">
                        Student Dashboard
                      </span>
                    </Link>
                  </button>
                ) : session?.user?.role === "admin" ? (
                  <button className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded">
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        
                        alt="profile"
                      />
                    </div>
                    <Link href="/bmpadmin/dashboard">
                      <span className="text-xl font-normal">
                        Admin Dashboard
                      </span>
                    </Link>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleLoginSignupClick();
                    }}
                    className="bg-primary text-white flex gap-3 items-center py-2 px-4 rounded"
                  >
                    <div className="w-5">
                      <Image
                        src="/images/home/profile.png"
                        width={1000}
                        height={500}
                        
                        alt="profile"
                      />
                    </div>
                    <span className="text-xl font-normal">Login / Signup</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booking Message Modal */}
        {showBookingMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md mx-4">
              <p className="text-lg mb-4">
                Click the &quot;Book Me&quot; button on the page to register
              </p>
              <button
                onClick={() => setShowBookingMessage(false)}
                className="bg-primary text-white px-4 py-2 rounded w-full"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </section>
      <section>
        {/* Plan Modal*/}
        <div
          id="planModal"
          className={`fixed inset-0 z-50 overflow-y-auto ${
            isPlanModalOpen ? "block" : "hidden"
          }`}
          aria-hidden={!isPlanModalOpen}
        >
          {/* Semi-transparent*/}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPlanModalOpen(false)}
          ></div>

          <div className="flex items-center justify-center min-h-screen relative">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl relative z-10">
              {/* Close Button with enhanced styling */}
              <button
                onClick={() => setPlanModalOpen(false)}
                className="absolute top-4 right-4 text-2xl font-bold"
                aria-label="Close modal"
              >
                &times;
              </button>

              <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Tab Selection for Signup/Login with enhanced styling */}
                <div className="flex justify-center mb-6">
                  {["signup", "login"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 border ${
                        activeTab === tab
                          ? "bg-primary text-white"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === "signup" ? (
                  <>
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                      Choose Your Plan
                    </h2>

                    {/* Dropdown for billing cycle */}
                    <div className="flex justify-center mb-6">
                      {["monthly", "quarterly", "yearly"].map((cycle) => (
                        <button
                          key={cycle}
                          onClick={() => setBillingCycle(cycle)}
                          className={`px-4 py-2 border ${
                            billingCycle === cycle
                              ? "bg-primary text-white"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          } focus:outline-none focus:ring-2 focus:ring-primary`}
                        >
                          {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Object.keys(plans).map((planName, index) => {
                        const plan = plans[planName];
                        const { amount, currency, symbol, cycle } =
                          plan.currentPricing;
                        const signupUrl = `/auth/signup?plan=${planName}&billingCycle=${cycle}&countryCode=${countryCode}`;

                        return (
                          <div
                            key={planName}
                            className="bg-white p-6 rounded-2xl shadow-md text-center border border-primary-light hover:scale-105 transform transition-all duration-300"
                          >
                            <h3 className="text-xl font-semibold text-primary-dark">
                              {planName.charAt(0).toUpperCase() +
                                planName.slice(1)}
                            </h3>
                            <p className="text-gray-500">{plan.description}</p>

                            <div className="mt-4">
                              <span className="text-2xl font-bold text-primary-dark">
                                {formatPrice(amount, currency, symbol)}
                              </span>
                              <span className="text-gray-500 text-sm">
                                /{" "}
                                {cycle === "quarterly"
                                  ? "quarter"
                                  : cycle.replace("ly", "")}
                              </span>
                            </div>

                            <a
                              href={signupUrl}
                              className="mt-6 block w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark"
                            >
                              Get 1 Month Free Trial
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="transform transition-all duration-300 hover:scale-[1.02]">
                    <LoginForm closeModal={() => setPlanModalOpen(false)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}