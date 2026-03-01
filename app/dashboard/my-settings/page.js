"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ProfileEditComponent from "../../../components/ProfileEditComponent/page";
import DashboardHeader from "../../../components/DashboardHeader";
import SideMenu from "../../../components/SideMenu";
import Button from "@mui/material/Button";
import AppTheme from "../../../app/shared-theme/AppTheme";
import { Divider } from "@mui/material";

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from "../../../app/dashboard/theme/customizations";
import AdminCalendar from "../../../components/Availability";
import axios from "axios";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [passwordType, setPasswordType] = useState("password");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");
  const [error, setError] = useState("");
  const [accountTimezone, setAccountTimezone] = useState(null);
  const [tzLoading, setTzLoading] = useState(true);
  const [tzSaving, setTzSaving] = useState(false);

  // Build timezone options: common first, then all others
  const tzOptions = useMemo(() => {
    const getOffset = (tz) => {
      try {
        const parts = new Intl.DateTimeFormat("en", {
          timeZone: tz,
          timeZoneName: "shortOffset",
        }).formatToParts(new Date());
        const raw =
          parts.find((p) => p.type === "timeZoneName")?.value || "GMT";
        const offset = raw.replace("GMT", "").trim();
        if (!offset) return "UTC+00:00";
        const sign = offset[0];
        const [h, m = "00"] = offset.slice(1).split(":");
        return `UTC${sign}${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
      } catch {
        return "UTC";
      }
    };

    const COMMON = [
      "Pacific/Honolulu",
      "America/Anchorage",
      "America/Los_Angeles",
      "America/Denver",
      "America/Chicago",
      "America/New_York",
      "America/Toronto",
      "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires",
      "Atlantic/Azores",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Helsinki",
      "Europe/Istanbul",
      "Europe/Moscow",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Asia/Dubai",
      "Asia/Karachi",
      "Asia/Colombo",
      "Asia/Kolkata",
      "Asia/Dhaka",
      "Asia/Bangkok",
      "Asia/Singapore",
      "Asia/Kuala_Lumpur",
      "Asia/Shanghai",
      "Asia/Hong_Kong",
      "Asia/Tokyo",
      "Asia/Seoul",
      "Australia/Perth",
      "Australia/Darwin",
      "Australia/Adelaide",
      "Australia/Brisbane",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Australia/Hobart",
      "Pacific/Auckland",
      "Pacific/Fiji",
    ];

    const commonSet = new Set(COMMON);
    const makeOpt = (tz, group) => ({
      value: tz,
      label: `${getOffset(tz)} — ${tz.replace(/_/g, " ")}`,
      group,
    });

    const commonOpts = COMMON.map((tz) => makeOpt(tz, "Common Timezones"));

    let restOpts = [];
    try {
      restOpts = Intl.supportedValuesOf("timeZone")
        .filter((tz) => !commonSet.has(tz))
        .sort()
        .map((tz) => makeOpt(tz, "All Timezones"));
    } catch {
      restOpts = [];
    }

    return [...commonOpts, ...restOpts];
  }, []);

  const coachId = session?.user?.id ?? null;

  // Load coach's saved timezone from DB
  useEffect(() => {
    if (status !== "authenticated" || !coachId) return;
    setTzLoading(true);
    axios
      .get(`/api/coach/${coachId}`)
      .then((res) => {
        setAccountTimezone(res.data?.timezone || "Australia/Sydney");
      })
      .catch(() => {
        setAccountTimezone("Australia/Sydney");
      })
      .finally(() => setTzLoading(false));
  }, [status, coachId]);

  const handleTimezoneUpdate = async () => {
    setTzSaving(true);
    try {
      await axios.patch(`/api/coach/${coachId}`, {
        timezone: accountTimezone,
      });
      toast.success("Timezone updated successfully.", {
        toastId: "tz-success",
        position: "top-right",
        autoClose: 3000,
      });
    } catch {
      toast.error("Failed to update timezone.", {
        toastId: "tz-error",
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setTzSaving(false);
    }
  };

  const handlePasswordFocus = () => setPasswordType("text");
  const handlePasswordBlur = () => setPasswordType("password");

  const handleConfirmPasswordFocus = () => setConfirmPasswordType("text");
  const handleConfirmPasswordBlur = () => setConfirmPasswordType("password");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

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

  // const handleDateClick = (date) => {
  //   setSelectedDate(date); // Store the selected date
  //   setShowDataGrid(true); // Show the data grid
  // };

  // const handleProfileClick = () => setShowProfileEdit(true);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset error state before submission
    try {
      // if (newPassword !== confirmPassword) {
      //   setError("New password and confirm password do not match.");
      //   toast.error("New password and confirm password do not match.");
      //   return;
      // }

      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, oldPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password updated successfully!", {
          toastId: "password-success",
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        setEmail(""); // Clear form fields
        setOldPassword("");
        setNewPassword("");
      } else {
        toast.error(data.message || "Failed to update password.", {
          toastId: "password-error",
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.", {
        toastId: "password-network-error",
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      console.error("Error in handleSubmit:", error);
    }
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <div className="h-full w-full m-0 p-0">
        {/* Top Header */}
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

        {/* Sidebar */}
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

        {/* Main Content Area */}
        <Box
          sx={{
            paddingLeft: { md: "350px" },
            paddingTop: {
              xs: "42px",
              sm: "52px",
              md: "15px",
            },
            overflow: "auto",
            backgroundColor: "white",
            minHeight: "100vh",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-10 sm:py-10">
            <div className="font-kanit font-bold text-[20px] sm:text-[22px]  pb-5 mt-10 sm:mt-20">
              Account Settings
            </div>
            <div className="pb-5 text-[16px] sm:text-[18px]">
              <label>Email</label>
              <div className="flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[60px] rounded-[5px] border bg-white border-[#B0B6D3] px-3"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 sm:gap-10">
              <div className="text-[16px] sm:text-[18px] w-full sm:w-[48%]">
                <label>Old Password</label>
                <div className="flex">
                  <input
                    type="password"
                    value={oldPassword}
                    className="w-full h-[60px] rounded-[5px] border bg-white border-[#B0B6D3] px-3"
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="text-[16px] sm:text-[18px] w-full sm:w-[48%]">
                <label>New Password</label>
                <div className="flex">
                  <input
                    type="password"
                    value={newPassword}
                    className="w-full h-[60px] rounded-[5px] border bg-white border-[#B0B6D3] px-3"
                    onFocus={handleConfirmPasswordFocus}
                    onBlur={handleConfirmPasswordBlur}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500">{error}</p>}

            <button
              type="submit"
              className="bg-primary w-full sm:w-[120px] h-[34px] rounded mt-8 text-[14px] sm:text-[15px] text-white gap-5"
            >
              Update
            </button>

            {/* Timezone */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="font-kanit font-semibold text-[16px] sm:text-[18px] pb-1">
                Timezone
              </div>
              <p className="text-gray-500 text-sm mb-3">
                All your availability slots are saved in this timezone.
              </p>

              {/* Detected timezone banner */}
              {/* {(() => {
                const detected =
                  typeof window !== "undefined"
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone
                    : null;
                const detectedOpt = detected
                  ? tzOptions.find((o) => o.value === detected)
                  : null;
                return detectedOpt ? (
                  <p className="text-xs text-gray-400 mb-3">
                    🌐 Detected:{" "}
                    <span className="font-medium text-gray-600">
                      {detectedOpt.label}
                    </span>
                  </p>
                ) : null;
              })()} */}

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="w-full sm:w-[420px]">
                  <Autocomplete
                    options={tzOptions}
                    groupBy={(option) => option.group}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option.label
                    }
                    value={
                      tzOptions.find((o) => o.value === accountTimezone) || null
                    }
                    onChange={(_, newVal) =>
                      setAccountTimezone(newVal?.value || null)
                    }
                    disabled={tzLoading}
                    filterOptions={(options, { inputValue }) => {
                      const q = inputValue.toLowerCase();
                      return options.filter(
                        (o) =>
                          o.label.toLowerCase().includes(q) ||
                          o.value.toLowerCase().includes(q),
                      );
                    }}
                    ListboxProps={{ style: { maxHeight: 280 } }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Search timezone..."
                        label={tzLoading ? "Loading..." : "Timezone"}
                        sx={{
                          backgroundColor: "white",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "5px",
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li
                        {...props}
                        key={option.value}
                        style={{
                          fontFamily: "Kanit, sans-serif",
                          fontSize: "0.875rem",
                          padding: "6px 16px",
                        }}
                      >
                        <span
                          style={{
                            color: "#037D40",
                            fontWeight: 600,
                            minWidth: 112,
                            display: "inline-block",
                          }}
                        >
                          {option.label.split(" — ")[0]}
                        </span>
                        <span style={{ color: "#555" }}>
                          {" "}
                          — {option.label.split(" — ").slice(1).join(" — ")}
                        </span>
                      </li>
                    )}
                    renderGroup={(params) => (
                      <li key={params.key}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            color: "#037D40",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            backgroundColor: "#f5f5f5",
                            padding: "4px 16px",
                            position: "sticky",
                            top: -8,
                          }}
                        >
                          {params.group}
                        </div>
                        <ul style={{ padding: 0 }}>{params.children}</ul>
                      </li>
                    )}
                    sx={{ width: "100%" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTimezoneUpdate}
                  disabled={tzSaving || tzLoading || !accountTimezone}
                  className="bg-primary w-full sm:w-[160px] h-[40px] rounded text-[14px] text-white font-kanit font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {tzSaving ? (
                    <>
                      <CircularProgress size={14} color="inherit" /> Saving...
                    </>
                  ) : (
                    "Save Timezone"
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Divider */}
          <Box
            sx={{
              px: { xs: 3, sm: 10 },
              py: { xs: 2, sm: 4 },
            }}
          >
            <Divider
              sx={{
                borderColor: "#E0E0E0",
                borderWidth: { xs: 1, sm: 1.5 },
                width: "100%",
              }}
            />
          </Box>

          {/* Calendar Section with padding */}
          <Box
            sx={{
              px: { xs: 3, sm: 6 },
              py: { xs: 2, sm: 4 },
            }}
          >
            <AdminCalendar timezone={accountTimezone} />
          </Box>
        </Box>
      </div>
    </AppTheme>
  );
}
