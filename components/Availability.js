// components/Availability.js
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, MobileTimePicker } from "@mui/x-date-pickers";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import { useRouter } from "next/navigation";
import Typography from "@mui/material/Typography";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Divider,
  Grid,
  CardContent,
  Card,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Switch,
  MenuItem,
  Checkbox,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Delete,
  Schedule,
  Event,
  LocationSearching,
  Public,
} from "@mui/icons-material";
import { useSession } from "next-auth/react";
import { styled } from "@mui/material/styles";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { set } from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { DateTime } from "luxon";
import { LocationOn } from "@mui/icons-material";
import CoachLocation from "./CoachLocation";

dayjs.extend(utc);
dayjs.extend(timezone);

const StyledCard = ({ children }) => (
  <Card
    sx={{
      mb: 3,
      borderRadius: 2,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-2px)" },
    }}
  >
    <CardContent sx={{ p: 3 }}>{children}</CardContent>
  </Card>
);

const AdminCalendar = ({ timezone: propTimezone }) => {
  const { data: session } = useSession();
  const [availableDates, setAvailableDates] = useState([]);
  const [date, setDate] = useState(dayjs());
  const [startTime, setStartTime] = useState(dayjs());
  const [endTime, setEndTime] = useState(dayjs());
  const [timeSlots, setTimeSlots] = useState([]);
  const [multipleBookings, setMultipleBookings] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [stripeCustomerId, setStripeCustomerId] = useState(null);
  const [loadingCoachData, setLoadingCoachData] = useState(true);
  const [coachData, setCoachData] = useState(null);
  const [isAvailableDatesLoading, setIsAvailableDatesLoading] = useState(true);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  const router = useRouter();

  const parseMongoDate = (dateObj) => {
    if (dateObj?.$date?.$numberLong) {
      return new Date(parseInt(dateObj.$date.$numberLong));
    }
    return new Date(dateObj);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (session?.user?.id) {
          setIsAvailableDatesLoading(true);
          // Fetch all data in parallel using Promise.all
          const [dateResponse, coachResponse, locationsResponse] =
            await Promise.all([
              axios.get(
                `/api/available_dates?coachId=${session.user.id}&coach=true`,
              ),
              axios.get(`/api/coach/${session.user.id}`),
              axios.get(`/api/locations?coachId=${session.user.id}`),
            ]);

          setLocations(locationsResponse.data.locations || []);

          const paymentResponse = await axios.get(
            `/api/stripe/get-payment-methods?customerId=${session.user.id}`,
          );
          setPaymentMethods(paymentResponse.data.paymentMethods);
          if (paymentResponse.data.paymentMethods.length > 0) {
            setStripeCustomerId(
              paymentResponse.data.paymentMethods[0].customer,
            );
          }

          // Process availability dates
          // setUTCHours: DB stores dates as UTC midnight; comparing in UTC prevents
          // UTC+ users (e.g. Australia) from losing today's slots to the local-offset filter
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          const filteredAndSortedDates = dateResponse.data
            .map((d) => ({
              ...d,
              date: parseMongoDate(d.date), // Convert MongoDB date to JS Date
            }))
            .filter((d) => new Date(d.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setAvailableDates(filteredAndSortedDates);

          // Set coach data
          setCoachData(coachResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data", {
          toastId: "data-error",
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsAvailableDatesLoading(false);
        setLoadingCoachData(false);
      }
    };

    fetchData();
  }, [session]);

  const addTimeSlot = () => {
    const now = dayjs();
    const isTodaySelected = dayjs(date).isSame(now, "day");

    if (!startTime || !endTime) {
      toast.warning("Select both start and end times.", {
        toastId: "time-warning",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }

    const newStartTime = startTime.toDate();
    const newEndTime = endTime.toDate();

    if (newStartTime >= newEndTime) {
      toast.error("End time must be after start time.", {
        toastId: "time-error",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }

    if (isTodaySelected && startTime.isBefore(now)) {
      toast.error("Cannot add past time slots for today.", {
        toastId: "past-time-error",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }

    // dayjs.format gives a consistent HH:mm string regardless of locale or browser;
    // toTimeString() can vary across iOS Safari versions
    const startString = dayjs(startTime).format("HH:mm");
    const endString = dayjs(endTime).format("HH:mm");
    const slotTime = `${startString} - ${endString}`;

    // When location mode is on, a location must be chosen before staging the slot
    if (isLocationEnabled && !selectedLocation) {
      toast.warning("Please select a location before adding a time slot.", {
        toastId: "location-required-warning",
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Duplicate rule:
    // Same time + same location  → blocked
    // Same time + different location → allowed (two venues at the same hour is valid)

    // 1. Check within the current staged batch
    const normalizeLocation = (loc) => loc || null;
    const newLocNorm = isLocationEnabled
      ? normalizeLocation(selectedLocation)
      : null;

    const isDuplicate = timeSlots.some((slot) => {
      if (slot.time !== slotTime) return false;
      const stagedLoc = normalizeLocation(slot.location);
      return stagedLoc === newLocNorm;
    });

    // 2. Also check against already-saved slots for this date so a second
    //    "Save Availability" run with the same slot is caught here, before save.
    const formattedDateCheck = dayjs(date).format("YYYY-MM-DD");
    const savedSlots =
      availableDates.find(
        (d) =>
          new Date(d.date).toISOString().split("T")[0] === formattedDateCheck,
      )?.timeSlots || [];

    const isSavedDuplicate = savedSlots.some((slot) => {
      if (slot.time !== slotTime) return false;
      const savedLoc = normalizeLocation(slot.location);
      return savedLoc === newLocNorm;
    });

    if (isDuplicate || isSavedDuplicate) {
      toast.error(
        isLocationEnabled && selectedLocation
          ? `A slot "${slotTime}" at "${selectedLocation}" already exists for this date.`
          : `A slot "${slotTime}" already exists for this date.`,
        {
          toastId: "duplicate-slot-error",
          position: "top-right",
          autoClose: 3000,
        },
      );
      return;
    }

    const newSlot = {
      time: slotTime,
      multipleBookings,
      timezone: propTimezone || coachData?.timezone || "Australia/Sydney",
      ...(isLocationEnabled &&
        selectedLocation && { location: selectedLocation }),
    };

    setTimeSlots([...timeSlots, newSlot]);
    setStartTime(dayjs().startOf("hour"));
    setEndTime(dayjs().startOf("hour").add(1, "hour"));
  };

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    setPaymentLoading(true);
    try {
      const response = await axios.post("/api/stripe/delete-payment-method", {
        paymentMethodId,
      });

      // Check API-level success flag
      if (response?.data?.success) {
        // Force reload user data
        await router.replace(router.asPath);

        setPaymentMethods((prev) =>
          prev.filter((pm) => pm.id !== paymentMethodId),
        );
        setCoachData((c) => (c ? { ...c, paymentStatus: "inactive" } : c));
        toast.success("Payment method removed; subscription is now inactive", {
          toastId: "payment-success",
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        console.error("API error:", response.data.error);
        toast.error(response.data.error || "Error removing payment method", {
          toastId: "api-error",
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Network or server error:", err);
      toast.error("Error removing payment method", {
        toastId: "payment-error",
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Add this handler function
  const handleLocationToggle = async (event) => {
    const enabled = event.target.checked;
    setIsLocationEnabled(enabled);

    if (enabled) {
      // Re-fetch latest locations so we always have current data
      try {
        const res = await axios.get(
          `/api/locations?coachId=${session.user.id}`,
        );
        setLocations(res.data.locations || []);
      } catch (_) {}
    } else {
      setSelectedLocation("");
    }
  };

  const addAvailableSlots = async () => {
    if (!date) {
      toast.warning("Select a date.", {
        toastId: "date-warning",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }
    if (timeSlots.length === 0) {
      toast.warning("Add at least one time slot.", {
        toastId: "time-slot-warning",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }

    const coachId = session?.user?.id;
    if (!coachId) {
      toast.error("Coach ID unavailable.", {
        toastId: "coach-id-error",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }

    // dayjs.format preserves the local calendar date without UTC conversion;
    // new Date(dayjsObj).toISOString() would shift the date backward for UTC+ zones (e.g. Australia UTC+10/11)
    const formattedDate = dayjs(date).format("YYYY-MM-DD");

    if (formattedDate < dayjs().format("YYYY-MM-DD")) {
      toast.error("Cannot add past dates.", {
        toastId: "past-time-error",
        position: "top-right",
        autoClose: 3000,
      });

      return;
    }

    // Always load fresh data to ensure we have the latest information
    let currentAvailableDates = [];
    try {
      const response = await axios.get(
        `/api/available_dates?coachId=${coachId}&coach=true`,
      );

      // setUTCHours: DB stores dates as UTC midnight; using local setHours would
      // shift "today" forward by the UTC offset, incorrectly dropping valid future dates
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      currentAvailableDates = response.data
        .map((d) => ({ ...d, date: parseMongoDate(d.date) }))
        .filter((d) => d.date >= todayUTC);

      // Update state with fresh data
      setAvailableDates(currentAvailableDates);
    } catch (error) {
      toast.error("Failed to load availability data", {
        toastId: "load-error",
        position: "top-right",
        autoClose: 3000,
      });
      console.error("Error loading dates:", error);
      return;
    }

    // Find an existing document whose stored UTC-midnight date matches the chosen calendar date
    const existingDate = currentAvailableDates.find(
      (d) => d.date.toISOString().split("T")[0] === formattedDate,
    );

    try {
      if (existingDate) {
        // Check for overlapping time slots.
        // Slots at *different* locations are independent and cannot conflict with each other.
        const isOverlapping = timeSlots.some((newSlot) =>
          existingDate.timeSlots.some((existingSlot) => {
            // Different locations → no conflict regardless of time
            const newLoc = newSlot.location || null;
            const existingLoc = existingSlot.location || null;
            if (newLoc !== existingLoc) return false;

            const [existingStart, existingEnd] = existingSlot.time
              .split(" - ")
              .map((t) => new Date(`1970-01-01T${t}:00`));
            const [newStart, newEnd] = newSlot.time
              .split(" - ")
              .map((t) => new Date(`1970-01-01T${t}:00`));

            return newStart < existingEnd && newEnd > existingStart;
          }),
        );

        if (isOverlapping) {
          toast.error(
            "One or more slots overlap with existing slots at the same location.",
            {
              toastId: "overlap-error",
              position: "top-right",
              autoClose: 3000,
            },
          );
          return;
        }

        const response = await axios.put(
          `/api/available_dates?id=${existingDate._id}`,
          { timeSlots },
        );

        // Update state with the new slots
        const updatedDates = currentAvailableDates.map((d) =>
          d._id === existingDate._id
            ? { ...d, timeSlots: [...d.timeSlots, ...timeSlots] }
            : d,
        );
        setAvailableDates(updatedDates);

        toast.success("Added new slots to existing date.", {
          toastId: "availability-success",
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        const response = await axios.post("/api/available_dates", {
          date: formattedDate,
          timeSlots,
          coachId,
          timezone: propTimezone || coachData?.timezone || "Australia/Sydney",
        });

        const savedDate = response.data;
        setAvailableDates([...currentAvailableDates, savedDate]);

        toast.success("New date and slots added successfully.", {
          toastId: "new-date-success",
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.error("Failed to add slots.", {
        toastId: "failed-slot-error",
        position: "top-right",
        autoClose: 3000,
      });
      console.error("❌ Error adding slots:", error);
    }

    setTimeSlots([]);
    setMultipleBookings(false);
  };

  const removeAvailableDate = async (id) => {
    try {
      await axios.delete(`/api/available_dates?id=${id}`);
      setAvailableDates(availableDates.filter((item) => item._id !== id));
      toast.success("Date removed successfully.", {
        toastId: "date-remove-success",
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error removing date:", error);
      toast.error("Failed to remove date.", {
        toastId: "date-remove-error",
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const removeTimeSlotFromDate = async (availableDateId, index) => {
    const availableDate = availableDates.find((d) => d._id === availableDateId);
    if (!availableDate) return;
    const updateTimeSlots = availableDate.timeSlots.filter(
      (_, i) => i !== index,
    );

    try {
      // ?replace=true signals the API to fully replace the stored slots
      // instead of merging, so the deleted slot is actually removed.
      await axios.put(
        `/api/available_dates?id=${availableDateId}&replace=true`,
        {
          timeSlots: updateTimeSlots,
        },
      );
      setAvailableDates(
        availableDates.map((d) =>
          d._id === availableDateId ? { ...d, timeSlots: updateTimeSlots } : d,
        ),
      );
      toast.success("Time slot removed successfully.", {
        toastId: "time-slot-success",
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating time slots:", error);
      toast.error("Failed to update time slots.", {
        toastId: "time-slot-error",
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <ToastContainer position="top-right" autoClose={5000} />

        <Typography
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: 700,
            color: "#037D40",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Schedule fontSize="large" />
          Customized My Availability
        </Typography>

        <StyledCard>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#037D40",
                }}
              >
                <Event /> Date & Time Setup
              </Typography>

              <DatePicker
                label="Select Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                sx={{ mb: 2, width: "100%" }}
                format="DD/MM/YYYY"
                minDate={dayjs()}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TimePicker
                    label="Start Time"
                    defaultValue={dayjs("2022-04-17T15:30")}
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="End Time"
                    defaultValue={dayjs("2022-04-17T16:30")}
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                  />
                </Grid>
              </Grid>

              {/* Read-only timezone indicator for the availability form */}
              <Box
                sx={{
                  mt: 2,
                  px: 1.5,
                  py: 1,
                  bgcolor: "#E6F2EC",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <Public sx={{ color: "#037D40", fontSize: "1rem" }} />
                <Typography variant="caption" sx={{ color: "#037D40" }}>
                  Slots will be saved in:{" "}
                  <strong>
                    {(propTimezone || coachData?.timezone)?.replace(
                      /_/g,
                      " ",
                    ) || "Australia / Sydney"}
                  </strong>
                  . Change it under <strong>Account Settings</strong> at the top
                  of this page.
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={multipleBookings}
                    onChange={(e) => setMultipleBookings(e.target.checked)}
                    color="primary"
                  />
                }
                label="Allow Multiple Bookings"
                sx={{ mt: 1.5, display: "block" }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isLocationEnabled}
                    onChange={handleLocationToggle}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#037D40", // green-500
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "#10B981",
                        },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationOn sx={{ color: "#037D40" }} />
                    <Typography>Enable Location Selection</Typography>
                  </Box>
                }
                sx={{ mb: 2 }}
              />

              {isLocationEnabled && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  {locations.length === 0 ? (
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        bgcolor: "#FFF8E1",
                        borderRadius: "8px",
                        border: "1px solid #FFE082",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#795548", lineHeight: 1.6 }}
                      >
                        No locations set up yet. Add your locations in the{" "}
                        <strong>Coach Location</strong> section below, then
                        enable this toggle again.
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <InputLabel id="location-select-label">
                        Location
                      </InputLabel>
                      <Select
                        labelId="location-select-label"
                        id="location-select"
                        value={selectedLocation}
                        label="Location"
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        required
                      >
                        {locations.map((location, index) => (
                          <MenuItem key={index} value={location}>
                            {location}
                          </MenuItem>
                        ))}
                      </Select>
                    </>
                  )}
                </FormControl>
              )}

              <Button
                onClick={addTimeSlot}
                fullWidth
                sx={{
                  mt: { xs: 1, sm: 2 },
                  backgroundColor: "#037D40",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#026935",
                    color: "white",
                  },
                  fontFamily: "Kanit, sans-serif",
                }}
              >
                Add Time Slot
              </Button>
            </Grid>

            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  borderLeft: { md: "1px solid #e0e0e0" },
                  pl: { md: 3 },
                  height: "100%",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    color: "#037D40",
                  }}
                >
                  <Schedule /> Current Slots
                </Typography>
                {timeSlots.length > 0 ? (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {timeSlots.map((slot, index) => (
                      <Chip
                        key={index}
                        label={`${slot.time} · ${
                          slot.timezone?.split("/")[1]?.replace(/_/g, " ") ||
                          "Sydney"
                        } (${slot.multipleBookings ? "Multi" : "Single"})${
                          slot.location
                            ? ` — ${slot.location}`
                            : slot.locations &&
                                Array.isArray(slot.locations) &&
                                slot.locations.length
                              ? ` — ${slot.locations.join(", ")}`
                              : ""
                        }`}
                        onDelete={() =>
                          setTimeSlots(timeSlots.filter((_, i) => i !== index))
                        }
                        deleteIcon={<Delete fontSize="small" />}
                        sx={{
                          bgcolor: "#E6F2EC",
                          "& .MuiChip-deleteIcon": {
                            color: "#037D40",
                            fontSize: "1.2rem",
                          },
                          padding: "10px 9px",
                          height: "auto",
                          borderRadius: "8px",
                          "& .MuiChip-label": {
                            fontSize: "0.9rem",
                            padding: "6px 5px",
                          },
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No time slots added yet
                  </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                <Button
                  onClick={addAvailableSlots}
                  fullWidth
                  size="large"
                  sx={{
                    backgroundColor: "#037D40",
                    py: 1.5,
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#026935",
                      color: "white",
                    },
                    fontFamily: "Kanit, sans-serif",
                    fontSize: "1.1rem",
                  }}
                >
                  Save Availability
                </Button>
              </Box>
            </Grid>
          </Grid>
        </StyledCard>

        <StyledCard>
          <CoachLocation />
        </StyledCard>

        <StyledCard>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "#037D40",
            }}
          >
            <Event /> Scheduled Dates
          </Typography>

          {availableDates.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Time Slots</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableDates.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell>
                        {dayjs(d.date).format("ddd, MMM D, YYYY")}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}
                        >
                          {d.timeSlots.map((slot, index) => (
                            <Chip
                              key={index}
                              label={`${slot.time} · ${
                                slot.timezone
                                  ?.split("/")[1]
                                  ?.replace(/_/g, " ") || "Sydney"
                              } (${
                                slot.multipleBookings ? "Multi" : "Single"
                              })${
                                slot.locations?.length
                                  ? ` — ${slot.locations.join(", ")}`
                                  : slot.location
                                    ? ` — ${slot.location}`
                                    : ""
                              }`}
                              onDelete={() =>
                                removeTimeSlotFromDate(d._id, index)
                              }
                              sx={{
                                bgcolor: "#E6F2EC",
                                "& .MuiChip-deleteIcon": {
                                  color: "#037D40",
                                  fontSize: "1.2rem",
                                },
                                padding: "10px 9px",
                                height: "auto",
                                borderRadius: "8px",
                                "& .MuiChip-label": {
                                  fontSize: "0.9rem",
                                  padding: "6px 5px",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => removeAvailableDate(d._id)}
                          sx={{ color: "#ff4444" }}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No scheduled dates available
            </Typography>
          )}
        </StyledCard>

        <StyledCard>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "#037D40",
            }}
          >
            <Event /> Account Details
          </Typography>

          {loadingCoachData ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : coachData ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Current Plan
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ textTransform: "capitalize" }}
                >
                  {coachData.plan || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Billing Cycle
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ textTransform: "capitalize" }}
                >
                  {coachData.billingCycle || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Payment Status
                </Typography>
                <Chip
                  label={coachData.paymentStatus || "N/A"}
                  sx={{
                    textTransform: "capitalize",
                    backgroundColor:
                      coachData.paymentStatus === "active"
                        ? "#e8f5e9"
                        : coachData.paymentStatus === "inactive"
                          ? "#ffebee"
                          : "#fff3e0",
                    color:
                      coachData.paymentStatus === "active"
                        ? "#2e7d32"
                        : coachData.paymentStatus === "inactive"
                          ? "#c62828"
                          : "#ef6c00",
                  }}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="error">
              Failed to load account details
            </Typography>
          )}

          {!stripeCustomerId ? (
            <Typography variant="body2" color="textSecondary">
              Complete your subscription setup to manage payment methods
            </Typography>
          ) : (
            <>
              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Saved Payment Methods
              </Typography>

              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <Box
                    key={method.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      mb: 1,
                      bgcolor: "#E6F2EC",
                      borderRadius: 1,
                    }}
                  >
                    <div>
                      <Typography>
                        {method.card.brand.toUpperCase()} ****{" "}
                        {method.card.last4}
                      </Typography>
                      <Typography variant="body2">
                        Exp: {method.card.exp_month}/{method.card.exp_year}
                      </Typography>
                    </div>

                    <Button
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      // add red color to the button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      disabled={paymentLoading}
                      sx={{ textTransform: "none" }}
                    >
                      Cancel Subscription
                    </Button>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No saved payment methods
                </Typography>
              )}
            </>
          )}
        </StyledCard>
      </Container>
    </LocalizationProvider>
  );
};

export default AdminCalendar;
