// auth/signup/page.js
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  CircleCheck,
  Eye,
  EyeOff,
  Phone,
  UserPlus,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import ProgressBar from "../../../components/ProgressBar";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import validator from "validator";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Image from "next/image";
import { useLocationPricing } from "../../../app/hooks/useLocationPricing";
import { normalizeCountryCode } from "../../../app/config/pricing";

// ensures the component is not re-created on every state change, preventing focus loss.
const InputField = ({
  id,
  type,
  value,
  onChange,
  onFocus,
  // onBlur,
  placeholder,
  fieldName,
  icon: Icon,
  children,
  focusedField,
  validFields,
  fieldErrors,
}) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
      <Icon
        size={20}
        className={`transition-colors duration-200 ${
          focusedField === fieldName
            ? "text-lime-500"
            : validFields[fieldName]
              ? "text-green-500"
              : fieldErrors[fieldName]
                ? "text-red-500"
                : "text-gray-400"
        }`}
      />
    </div>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      // onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full py-4 pl-12 pr-12 border-2 rounded-xl transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white/95 focus:bg-white placeholder-gray-400 focus:placeholder-gray-500 ${
        fieldErrors[fieldName]
          ? "border-red-400 shadow-red-100 focus:shadow-red-200"
          : validFields[fieldName]
            ? "border-green-400 shadow-green-100 focus:shadow-green-200"
            : focusedField === fieldName
              ? "border-lime-400 shadow-blue-100 focus:shadow-blue-200"
              : "border-gray-200 hover:border-gray-300"
      } focus:outline-none focus:ring-4 focus:shadow-lg transform hover:scale-[1.02] focus:scale-[1.02] focus:backdrop-blur-none focus:ring-lime-200`}
      required
    />
    {/* Slot for additional elements like the password visibility toggle */}
    {children}

    {/* Validation checkmark */}
    {validFields[fieldName] && !fieldErrors[fieldName] && (
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <CircleCheck size={20} className="text-green-500 animate-pulse" />
      </div>
    )}
  </div>
);

// Component containing useSearchParams()
function SignupContent({ initialCountryCode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract query parameters
  const plan = searchParams.get("plan");
  const billingCycle = searchParams.get("billingCycle");
  // **MODIFIED:** Directly get the country code without decoding
  const countryCodeFromUrl = searchParams.get("countryCode");

  // State for price and loading
  const [priceDetails, setPriceDetails] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Normalized code is used for pricing and phone input defaults
  const normalizedUrlCountry = normalizeCountryCode(countryCodeFromUrl);

  // Initialize pricing hook using the decoded country code if available
  const {
    getPricing,
    formatPrice,
    countryCode: pricingCountry,
  } = useLocationPricing(normalizedUrlCountry);

  // Separate state for phone input country code
  const [countryCode, setCountryCode] = useState(
    normalizedUrlCountry || pricingCountry,
  );

  // Sync phone input country with pricing country when not locked by URL
  useEffect(() => {
    if (
      !normalizedUrlCountry &&
      pricingCountry &&
      pricingCountry !== countryCode
    ) {
      setCountryCode(pricingCountry);
    }
  }, [pricingCountry, normalizedUrlCountry, countryCode]);

  // State for form fields and validation
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    email: "",
    password: "",
    contact: "",
  });
  const [focusedField, setFocusedField] = useState("");
  // State to track valid fields
  const [validFields, setValidFields] = useState({
    firstName: false,
    email: false,
    password: false,
    contact: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  // State to track password requirements
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const isPhoneCountryLocked = !!normalizedUrlCountry;

  // Validate query parameters
  useEffect(() => {
    const validPlans = ["starter", "growth", "pro", "enterprise"];
    const validBillingCycles = ["monthly", "quarterly", "yearly"];

    if (!validPlans.includes(plan)) {
      setError("Invalid plan selected. Please choose a valid plan.");
      return;
    }

    if (!billingCycle || !validBillingCycles.includes(billingCycle)) {
      setError(
        "Invalid or missing billing cycle. Please select a valid billing cycle.",
      );
      return;
    }
  }, [plan, billingCycle, countryCode]);

  // Fetch package data based on plan and billing cycle
  useEffect(() => {
    if (plan && billingCycle) {
      setLoadingPrice(true);
      const details = getPricing(plan, billingCycle);
      setPriceDetails(details);
      setLoadingPrice(false);
    } else {
      setError("Plan or billing cycle is missing from the URL.");
      setLoadingPrice(false);
    }
  }, [plan, billingCycle, getPricing]);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // Email validation function
  const isValidEmail = (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!validator.isEmail(email.trim())) {
      return false;
    }

    const emailDomain = email.split("@")[1].toLowerCase();
    const allowedDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
    ];
    const isAllowedDomain = allowedDomains.some((domain) =>
      emailDomain.endsWith(domain),
    );

    return isAllowedDomain;
  };

  const [selectedPlan, setSelectedPlan] = useState("starter");
  const [billingType, setBillingType] = useState("monthly");

  // Phone number validation function
  const isValidPhone = (phone) => {
    try {
      const phoneNumber = parsePhoneNumberFromString(phone);
      return phoneNumber && phoneNumber.isValid();
    } catch (error) {
      return false;
    }
  };

  // Password validation function
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

    if (
      !conditions.lowercase ||
      !conditions.uppercase ||
      !conditions.number ||
      !conditions.specialChar
    ) {
      return "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.";
    }

    return "";
  };

  // Handle field change and check if valid
  const handleFieldChange = (field, value, setter) => {
    setter(value);

    // Clear current field error
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");

    // Validate the field and update validFields state
    let isValid = false;

    if (field === "firstName") {
      isValid = value.trim().length > 0;
    } else if (field === "email") {
      isValid = isValidEmail(value);
    } else if (field === "password") {
      isValid = getPasswordError(value) === "";
    } else if (field === "contact") {
      isValid = isValidPhone(value);
    }

    setValidFields((prev) => ({
      ...prev,
      [field]: isValid,
    }));
  };

  // Special handler for phone since it uses a different onChange pattern
  const handlePhoneChange = (phone, meta) => {
    setPhoneValue(phone);
    if (meta.country) {
      setCountryCode(meta.country.iso2.toUpperCase());
    }
  };

  // Validate all form fields
  const validateForm = () => {
    const errors = {
      firstName: !firstName.trim() ? "First name is required" : "",
      email: !email.trim()
        ? "Email is required"
        : !isValidEmail(email)
          ? "Please enter a valid email address with a common domain"
          : "",
      password: getPasswordError(password),
      contact: !phoneValue
        ? "Contact number is required"
        : !isValidPhone(phoneValue)
          ? "Please enter a valid phone number"
          : "",
    };

    setFieldErrors(errors);

    // Update valid fields based on errors
    setValidFields({
      firstName: !errors.firstName,
      email: !errors.email,
      password: !errors.password,
      contact: !errors.contact,
    });

    return !Object.values(errors).some((error) => error); // Return true if no errors
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate form before submission
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const userData = {
      firstName,
      email,
      password,
      contact: phoneValue,
      plan: plan,
      billingCycle: billingCycle,
      countryCode: countryCode,
    };

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed. Please try again.");
      } else {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          router.push(
            `/auth/payment?plan=${plan}&billingCycle=${billingCycle}&countryCode=${countryCode}&email=${encodeURIComponent(
              email,
            )}&name=${encodeURIComponent(firstName)}`,
          );
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({ isValid, text }) => (
    <li
      className={`flex items-center gap-2 transition-colors duration-300 ${
        isValid ? "text-green-500" : "text-gray-500"
      }`}
    >
      {isValid ? (
        <CheckCircle2 size={16} className="flex-shrink-0" />
      ) : (
        <Circle size={16} className="flex-shrink-0" />
      )}
      <span className="text-sm">{text}</span>
    </li>
  );

  return (
    <div
      className="grid place-items-center mt-20 mb-20 px-4"
      style={{
        background:
          "url('https://www.codingnepalweb.com/demos/create-glassmorphism-login-form-html-css/hero-bg.jpg') center/cover",
      }}
    >
      <ProgressBar currentStep={1} />
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
          Create an account to get started with the <b>{plan}</b> plan (
          {billingCycle} -
          {loadingPrice
            ? "Loading..."
            : `${priceDetails.symbol}${priceDetails.amount}`}
          )
        </p>

        {/* Display error for invalid query parameters */}
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="w-full">
            <input
              type="text"
              value={firstName}
              onChange={(e) =>
                handleFieldChange("firstName", e.target.value, setFirstName)
              }
              placeholder="Enter your first name"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                fieldErrors.firstName
                  ? "border-red-500"
                  : validFields.firstName
                    ? "border-primary"
                    : "border-gray-200"
              }`}
              required
            />
            {fieldErrors.firstName && (
              <p className="text-red-500 text-sm text-left mt-1">
                {fieldErrors.firstName}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="w-full">
            <input
              type="email"
              value={email}
              onChange={(e) =>
                handleFieldChange("email", e.target.value, setEmail)
              }
              placeholder="Enter your email"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                fieldErrors.email
                  ? "border-red-500"
                  : validFields.email
                    ? "border-primary"
                    : "border-gray-200"
              }`}
              required
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm text-left mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone Input Field */}
          <div className="w-full">
            <PhoneInput
              value={phoneValue}
              onChange={handlePhoneChange}
              defaultCountry={countryCode?.toLowerCase() || "au"}
              disableCountrySelector={isPhoneCountryLocked}
              // onBlur={() => setFocusedField('')}
              placeholder="Enter your phone number"
              className={`px-4 border-2 rounded-lg w-full bg-gray-100 ${
                fieldErrors.contact
                  ? "border-red-500"
                  : validFields.contact
                    ? "border-primary"
                    : "border-gray-200"
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
                "--react-international-phone-items": "flex",
                "--react-international-phone-item-align": "center",
                "--react-international-phone-justify-content": "center",
                "--react-international-phone-dropdown-align": "center",
                "--react-international-phone-height": "48px",
                "--react-international-phone-width": "48px",
              }}
              required
            />
            {fieldErrors.contact && (
              <p className="text-red-500 text-sm text-left mt-1">
                {fieldErrors.contact}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="w-full">
            <input
              type="password"
              value={password}
              onChange={(e) =>
                handleFieldChange("password", e.target.value, setPassword)
              }
              placeholder="Enter your password"
              className={`py-3 px-4 border-2 rounded-lg w-full bg-gray-100 ${
                fieldErrors.password
                  ? "border-red-500"
                  : validFields.password
                    ? "border-primary"
                    : "border-gray-200"
              }`}
              required
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm text-left mt-1">
                {fieldErrors.password}
              </p>
            )}
            {validFields.password && (
              <p className="text-primary text-sm text-left mt-1 gap-2 flex items-center">
                Password meets all requirements{" "}
                <CircleCheck
                  size={20}
                  className="mr-1 fill-primary stroke-white"
                />
              </p>
            )}
            <div className="items-center text-left mt-1 justify-center">
              <p className="text-sm text-gray-600 mt-1">
                Password must be at least 8 characters long and contain at least
                3 of the following:
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
                    color: passwordRequirements.specialChar ? "green" : "gray",
                  }}
                >
                  At least one special character
                </li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="py-3 px-6 rounded-lg text-white bg-primary hover:bg-primary-dark transition-all duration-300 w-full"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500 text-white p-3 rounded mt-4 text-center">
              {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              setLoading(true);
              signIn("google", {
                callbackUrl: `/auth/google-checkout?plan=${plan}&billingCycle=${billingCycle}&countryCode=${countryCode}&email=${encodeURIComponent(
                  email,
                )}&name=${encodeURIComponent(firstName)}`,
              });
            }}
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
        </form>
      </div>
    </div>
  );
}

export default function Signup() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
