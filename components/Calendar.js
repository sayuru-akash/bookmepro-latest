// component/Calendar.js
"use client";

import React, { useState, useEffect, Fragment } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { TextField, Button, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { X } from "lucide-react";
import StudentLogin from "../components/StudentLogin";
import StudentSignUp from "../components/StudentSignUp";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

dayjs.extend(utc);
dayjs.extend(timezone);

const Toast = ({ message, type, onClose }) => (
  <div className="fixed top-4 right-4 z-50 animate-slide-in">
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        type === "success"
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2">
        <X size={16} />
      </button>
    </div>
  </div>
);

export default function Calendar() {
  const { data: session } = useSession();
  const { coachId } = useParams();
  const [authStep, setAuthStep] = useState(null);
  const [student, setStudent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [messageType, setMessageType] = useState("");
  const [isIndividualSession, setIsIndividualSession] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    appointmentDetails: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentExceeded, setStudentExceeded] = useState(false);
  const [studentLimitInfo, setStudentLimitInfo] = useState({
    current: 0,
    max: 0,
  });

  // Open the modal
  const openModal = () => {
    setIsOpen(true);
  };

  // Close the modal and reset all related states
  const closeModal = () => {
    setIsOpen(false);
    setShowForm(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeSlots([]);
    setBookingMessage("");
    setFormErrors({});
  };

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (session?.user?.id && session?.user?.role === "student") {
        try {
          const response = await axios.get(`/api/students/${session.user.id}`);
          const studentData = response.data;

          const normalizedStudent = {
            id: studentData._id,
            name: studentData.name,
            email: studentData.email,
            phone: studentData.phone,
            address: studentData.address,
          };

          localStorage.setItem(
            "studentData",
            JSON.stringify(normalizedStudent),
          );
          setStudent(normalizedStudent);
          setFormData({
            name: normalizedStudent.name,
            email: normalizedStudent.email,
            phone: normalizedStudent.phone,
            address: normalizedStudent.address,
            appointmentDetails: "",
          });
        } catch (error) {
          console.error("Error fetching student data:", error);
          setAuthStep("login");
        }
      }
    };
    fetchStudentData();
  }, [session]);

  // Handle login success
  const handleLoginSuccess = (user) => {
    const normalizedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };
    setStudent(normalizedUser);
    setAuthStep(null);
    setFormData({
      ...formData,
      ...normalizedUser,
    });
  };

  const checkStudentLimit = async (coachId) => {
    try {
      const [studentCountRes, coachRes] = await Promise.all([
        axios.get(`/api/student-count`, { params: { coachId } }),
        axios.get(`/api/coach/${coachId}`),
      ]);

      const studentCount = studentCountRes.data.studentCount || 0;
      const maxStudents = coachRes.data.maxStudents || 25;

      setStudentLimitInfo({ current: studentCount, max: maxStudents });

      // Check if student count exceeds or equals maxStudents
      if (studentCount >= maxStudents) {
        setStudentExceeded(true);
        setSnackbarOpen(true);
        return false; // Cannot proceed with signup
      }

      setStudentExceeded(false);
      return true; // Can proceed with signup
    } catch (err) {
      console.error("Error checking student limit:", err);
      setError("Failed to check student limit.");
      return false;
    }
  };

  const handleSignUpClick = async () => {
    const canSignUp = await checkStudentLimit(coachId);
    if (canSignUp) {
      setAuthStep("signup");
    }
    // If canSignUp is false, the snackbar will show automatically
  };

  const handleSignUpSuccess = (response) => {
    setToast({
      show: true,
      message: "Registration successful! Redirecting to login...",
      type: "success",
    });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
      setAuthStep("login");
    }, 2000);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  // Fetch available dates for the coach
  useEffect(() => {
    const fetchAvailableDates = async () => {
      try {
        const response = await axios.get(
          `/api/available_dates?coachId=${coachId}`,
        );
        const datesWithTimeSlots = response.data.map((date) => ({
          date: new Date(date.date),
          timeSlots: (date.timeSlots || []).map((slot) => ({
            ...slot,
            // Ensure timezone is included, default to coach's timezone if not specified
            timezone: slot.timezone || date.timezone || "Australia/Melbourne",
            // Add local display time if not present
            // displayTime: slot.displayTime || slot.time,
            locations: slot.locations || [],
          })),
          // Include timezone at the date level
          timezone: date.timezone || "Australia/Melbourne",
        }));
        setAvailableDates(datesWithTimeSlots);
      } catch (error) {
        console.error("Error fetching available dates:", error);
      }
    };

    fetchAvailableDates();
  }, [coachId]);

  // Handle date selection
  const handleDateSelection = (date) => {
    const selectedAvailableDate = availableDates.find(
      (availableDate) =>
        availableDate.date.toDateString() === date.toDateString(),
    );

    if (selectedAvailableDate) {
      setSelectedDate(date);
      setSelectedTime(null);
      setTimeSlots(selectedAvailableDate.timeSlots);
    } else {
      setBookingMessage("Selected date is not available.");
      setMessageType("error");
    }
  };

  // Handle time selection.
  // Accepts the full slot object so same-time/different-location slots are unambiguous.
  const handleTimeSelect = async (selectedTimeSlot) => {
    try {
      if (!selectedTimeSlot) {
        setBookingMessage("Selected time slot is not valid.");
        setMessageType("error");
        return;
      }

      // Get the timezone from the slot or fall back to default
      const timezone = selectedTimeSlot.timezone || "Australia/Melbourne";

      // The specific location for this slot (null when location mode was not used)
      const slotLocation = selectedTimeSlot.location || null;

      // Convert selected date to the coach's timezone for accurate comparison
      const selectedDateInTimezone = dayjs(selectedDate).tz(timezone);

      const existingAppointments = await fetchExistingAppointments(
        selectedDateInTimezone.toDate(),
        selectedTimeSlot.time,
      );

      // Check if this student already booked this exact slot (time + location)
      if (student) {
        const existingStudentBooking = existingAppointments.some((app) => {
          const appDate = dayjs(app.selectedDate).tz(timezone);
          const appTime = app.selectedTime?.value ?? app.selectedTime;
          const appLocation = app.location || null;
          return (
            app.studentId === student.id &&
            (app.status === "pending" || app.status === "Approved") &&
            appDate.isSame(selectedDateInTimezone, "day") &&
            appTime === selectedTimeSlot.time &&
            appLocation === slotLocation // must match location too
          );
        });

        if (existingStudentBooking) {
          setBookingMessage("You already have a booking for this time slot.");
          setMessageType("error");
          setSelectedTime(null);
          return;
        }
      }

      // Check for individual bookings — scoped to this specific time + location.
      // A booking at Location A does NOT block Location B at the same time.
      const hasIndividualBooking = existingAppointments.some((app) => {
        const appDate = dayjs(app.selectedDate).tz(timezone);
        const appTime = app.selectedTime?.value ?? app.selectedTime;
        const appLocation = app.location || null;
        return (
          app.isIndividualSession &&
          (app.status === "pending" || app.status === "Approved") &&
          appDate.isSame(selectedDateInTimezone, "day") &&
          appTime === selectedTimeSlot.time &&
          appLocation === slotLocation // different locations remain bookable
        );
      });

      if (hasIndividualBooking) {
        setBookingMessage("This individual session is already booked.");
        setMessageType("error");
        setSelectedTime(null);
        return;
      }

      setIsIndividualSession(!selectedTimeSlot.multipleBookings);

      if (selectedTimeSlot.multipleBookings) {
        setBookingMessage("You can book this time slot for multiple users.");
        setMessageType("success");
      } else {
        setBookingMessage("This is an individual session.");
        setMessageType("info");
      }

      // Store the complete slot object including timezone and location
      setSelectedTime({
        value: selectedTimeSlot.time,
        timezone: timezone,
        location: slotLocation,
        slotData: selectedTimeSlot,
      });
    } catch (error) {
      console.error("Error in handleTimeSelect:", error);
      setBookingMessage("An unexpected error occurred. Please try again.");
      setMessageType("error");
    }
  };

  // Fetch existing appointments
  const fetchExistingAppointments = async (date, time) => {
    try {
      if (!date || !time) {
        console.warn(
          "fetchExistingAppointments called with invalid date or time",
        );
        return [];
      }

      const formattedDate = dayjs(date).format("YYYY-MM-DD");
      const response = await axios.get(
        `/api/appointments?coachId=${coachId}&selectedDate=${formattedDate}&selectedTime=${time}`,
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching existing appointments:", error);
      return [];
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent concurrent duplicate submissions (double-click, slow network, etc.)
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Fetch the latest student data
      if (!student?.id) {
        setToast({
          show: true,
          message: "Please complete authentication first",
          type: "error",
        });
        return;
      }

      const studentResponse = await axios.get(`/api/students/${student.id}`);
      const updatedStudentData = studentResponse.data;

      // Update formData with the latest student data
      const updatedFormData = {
        name: updatedStudentData.name,
        email: updatedStudentData.email,
        phone: updatedStudentData.phone,
        address: updatedStudentData.address,
        appointmentDetails: formData.appointmentDetails,
      };

      // Log for debugging (optional)
      console.log("Fetched student data:", updatedStudentData);

      // Submit the appointment with updated data
      const response = await axios.post("/api/appointments", {
        name: updatedFormData.name,
        email: updatedFormData.email,
        phone: updatedFormData.phone,
        address: updatedFormData.address,
        appointmentDetails: updatedFormData.appointmentDetails,
        selectedDate: dayjs(selectedDate).format("YYYY-MM-DD"),
        selectedTime,
        isIndividualSession,
        coachId,
        studentId: student.id,
        // Persist the specific location so duplicate checks and display are location-aware
        location: selectedTime?.location ?? null,
      });

      if (response.status === 201) {
        setToast({
          show: true,
          message: "Appointment booked successfully!",
          type: "success",
        });

        // Refresh available dates
        const updatedDatesResponse = await axios.get(
          `/api/available_dates?coachId=${coachId}`,
        );
        setAvailableDates(
          updatedDatesResponse.data.map((date) => ({
            date: new Date(date.date),
            timeSlots: date.timeSlots || [],
          })),
        );

        setTimeout(() => {
          closeModal();
          setToast({ show: false, message: "", type: "" });
        }, 2000);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setToast({
        show: true,
        message:
          error.response?.data?.message ||
          "Failed to book appointment. Please try again.",
        type: "error",
      });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle next button click
  const handleNext = () => {
    if (!student) {
      setAuthStep("login");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setBookingMessage("Please select a date and time.");
      setMessageType("error");
      return;
    }
    setShowForm(true);
  };

  // Go back to calendar view
  const goBackToCalendar = () => {
    setShowForm(false);
  };

  // Example safe timezone conversion
  const convertToTimezone = (date, tz) => {
    try {
      return dayjs(date).tz(tz).format();
    } catch (e) {
      console.error("Timezone conversion failed", e);
      return date; // fallback to original
    }
  };

  return (
    <>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "" })}
        />
      )}

      <button
        onClick={openModal}
        className="bg-[#037D40] hover:bg-[#025e30] text-white font-semibold py-[13px] px-[24px] gap-[16px] rounded-[8px] flex items-center transition-colors duration-200"
      >
        Book Me
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        {/* onClose intentionally disabled — prevents accidental form dismissal on backdrop click */}
        <Dialog as="div" className="relative z-[60]" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-start justify-center min-h-full pt-20 pb-6 px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                  {/* ── Sticky close bar — always visible ── */}
                  <div className="sticky top-0 z-10 bg-white flex justify-end px-4 pt-3 pb-2 border-b border-gray-100 rounded-t-2xl">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-150 text-xs font-medium"
                      title="Close"
                    >
                      <X size={15} />
                      <span>Close</span>
                    </button>
                  </div>

                  <div className="p-6 pt-4">
                    {!student ? (
                      <div className="auth-flow">
                        {authStep === "signup" ? (
                          <>
                            <StudentSignUp
                              onSuccess={handleSignUpSuccess}
                              coachId={coachId}
                            />
                            <div className="text-center mt-4">
                              <button
                                onClick={() => setAuthStep("login")}
                                className="text-blue-600 hover:underline"
                              >
                                Already have an account? Book directly
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <StudentLogin
                              onSuccess={handleLoginSuccess}
                              coachId={coachId}
                            />
                            <div className="text-center mt-4">
                              <button
                                onClick={handleSignUpClick} // Changed this line
                                className="text-blue-600 hover:underline"
                              >
                                <p>Don&apos;t have an account? Sign up here</p>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : !showForm ? (
                      <>
                        <div className="flex gap-4">
                          <Dialog.Title className="text-2xl font-bold leading-6 text-gray-900 pb-3">
                            Schedule an appointment
                          </Dialog.Title>
                        </div>
                        <DatePicker
                          selected={selectedDate}
                          onChange={handleDateSelection}
                          inline
                          filterDate={(date) =>
                            availableDates.some(
                              (availableDate) =>
                                availableDate.date.toDateString() ===
                                date.toDateString(),
                            )
                          }
                          className="bg-gray-50 dark:bg-[#037D40] rounded-lg shadow p-3 w-full text-xl"
                          dayClassName={(date) =>
                            date.toDateString() === selectedDate?.toDateString()
                              ? "bg-[#037D40] text-white rounded-md"
                              : ""
                          }
                        />

                        <label className="text-lg font-bold text-gray-900 mt-4 block text-left">
                          Pick your time
                        </label>
                        <ul
                          id="timetable"
                          className="grid w-full grid-cols-2 gap-2 mt-5"
                        >
                          {Array.isArray(timeSlots) && timeSlots.length > 0 ? (
                            timeSlots.map((slot, slotIndex) => {
                              const time = slot.time || "";
                              const tz = slot.timezone || "Australia/Sydney";
                              // Include index so same-time/different-location slots each get a unique id
                              const safeId = `slot-${slotIndex}-${time
                                .replace(/:/g, "-")
                                .replace(/\s/g, "-")}`;

                              // Compute student's browser-local equivalent time
                              let localTimeDisplay = null;
                              if (selectedDate && time) {
                                try {
                                  const dateStr =
                                    dayjs(selectedDate).format("YYYY-MM-DD");
                                  const [start, end] = time.split(" - ");
                                  if (start && end) {
                                    const startLocal = dayjs
                                      .tz(
                                        `${dateStr} ${start}`,
                                        "YYYY-MM-DD HH:mm",
                                        tz,
                                      )
                                      .local();
                                    const endLocal = dayjs
                                      .tz(
                                        `${dateStr} ${end}`,
                                        "YYYY-MM-DD HH:mm",
                                        tz,
                                      )
                                      .local();
                                    const zoneName =
                                      Intl.DateTimeFormat().resolvedOptions()
                                        .timeZone;
                                    // Only show if timezone differs from coach's
                                    if (zoneName !== tz) {
                                      localTimeDisplay = `${startLocal.format("h:mm A")} – ${endLocal.format("h:mm A")}`;
                                    }
                                  }
                                } catch (_) {
                                  // ignore conversion errors gracefully
                                }
                              }

                              return (
                                // Use slotIndex as key — same time can exist with different locations
                                <li key={slotIndex}>
                                  <input
                                    type="radio"
                                    id={safeId}
                                    value={safeId}
                                    className="hidden peer"
                                    name="timetable"
                                    onChange={() => handleTimeSelect(slot)}
                                  />
                                  <label
                                    htmlFor={safeId}
                                    className="inline-flex flex-col items-center justify-center w-full p-3 gap-0.5 text-sm font-medium text-center bg-white border rounded-lg cursor-pointer text-green-800 border-green-800 dark:hover:text-white peer-checked:border-green-800 peer-checked:bg-[#037D40] hover:text-white peer-checked:text-white hover:bg-green-500 dark:hover:bg-green-800 dark:hover:border-green-800 dark:peer-checked:bg-green-800"
                                  >
                                    <span className="text-sm font-semibold whitespace-nowrap leading-tight">
                                      {slot.time}
                                    </span>
                                    <span className="text-[0.65rem] opacity-75 whitespace-nowrap leading-tight">
                                      Timezone:{" "}
                                      {tz.split("/")[1]?.replace(/_/g, " ") ||
                                        tz}
                                    </span>
                                    {/* {localTimeDisplay && (
                                      <span className="text-[0.6rem] opacity-60 whitespace-nowrap leading-tight">
                                        Your time: {localTimeDisplay}
                                      </span>
                                    )} */}
                                    {slot.location && (
                                      <span className="text-[0.65rem] opacity-75 whitespace-nowrap leading-tight">
                                        {slot.location}
                                      </span>
                                    )}
                                  </label>
                                </li>
                              );
                            })
                          ) : (
                            <li className="text-lg text-gray-600 text-left font-normal">
                              Select a preferred date to see the available time
                              slots.
                            </li>
                          )}
                        </ul>

                        {bookingMessage && (
                          <div
                            className={`mt-4 p-3 rounded-lg ${
                              messageType === "success"
                                ? "bg-green-100 text-green-800"
                                : messageType === "error"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {bookingMessage}
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            className="text-white bg-[#037D40] hover:bg-green-900 font-medium rounded-lg text-sm px-4 py-2"
                            onClick={handleNext}
                            disabled={
                              !selectedDate || !selectedTime || isPopupOpen
                            }
                          >
                            Next
                          </button>
                        </div>
                      </>
                    ) : (
                      <form onSubmit={handleSubmit} sx={{ height: "200px" }}>
                        {" "}
                        {/* Increased height */}
                        <div className="flex gap-5 pb-3 ">
                          <Button
                            type="button"
                            onClick={goBackToCalendar}
                            className="bg-[#037D40] p-4"
                            sx={{
                              color: "white",
                              backgroundColor: "#037D40",
                              display: "flex",
                              alignItems: "center",
                              minWidth: "auto",
                            }}
                          >
                            <ArrowBackIcon sx={{ fontSize: "20px" }} />
                          </Button>

                          <h3 className="text-2xl font-bold leading-6 text-gray-900">
                            Booking Details
                          </h3>
                        </div>
                        <TextField
                          fullWidth
                          label="Appointment Details"
                          name="appointmentDetails"
                          value={formData.appointmentDetails}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              appointmentDetails: e.target.value,
                            })
                          }
                          error={!!formErrors.appointmentDetails}
                          helperText={formErrors.appointmentDetails}
                          margin="normal"
                        />
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            style={{
                              backgroundColor: isSubmitting
                                ? "#6b9e83"
                                : "#037D40",
                              color: "#fff",
                              fontWeight: "bold",
                            }}
                          >
                            {isSubmitting ? "Booking..." : "Book Appointment"}
                          </Button>
                        </Box>
                      </form>
                    )}
                  </div>
                  {/* Student Limit Exceeded Snackbar */}
                  <Snackbar
                    open={snackbarOpen}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                    sx={{
                      marginTop: "80px",
                      "& .MuiSnackbarContent-root": {
                        minWidth: "400px",
                      },
                    }}
                  >
                    <Alert
                      onClose={handleSnackbarClose}
                      severity="warning"
                      variant="filled"
                      sx={{
                        width: "100%",
                        backgroundColor: "#D76C82",
                        color: "white",
                        fontFamily: "Kanit, sans-serif",
                        fontSize: "14px",
                        boxShadow: "0 8px 32px rgba(255, 107, 53, 0.3)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        "& .MuiAlert-icon": {
                          color: "white",
                        },
                        "& .MuiAlert-action": {
                          padding: 0,
                          marginRight: "-8px",
                        },
                        "& .MuiIconButton-root": {
                          color: "white",
                          "&:hover": {
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          },
                        },
                      }}
                    >
                      <Box>
                        <Box sx={{ fontWeight: 600, marginBottom: "4px" }}>
                          Student Limit Reached!
                        </Box>
                        <Box sx={{ fontSize: "13px", opacity: 0.9 }}>
                          You coach has reached the maximum limit of{" "}
                          {studentLimitInfo.max} students. Please Contact your
                          coach.
                        </Box>
                      </Box>
                    </Alert>
                  </Snackbar>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
