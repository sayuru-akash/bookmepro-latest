import React from "react";
import axios from "axios";
import { useTheme } from "@mui/material/styles";
import {
  CircleChevronUp,
  User,
  CalendarDays,
  Clock,
  Bell,
  Phone,
  Mail,
  CircleX,
  CircleCheck,
  MapPin,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import Button from "@mui/material/Button";
import "react-toastify/dist/ReactToastify.css";

const UserDescription = ({ user, onClose }) => {
  if (!user) return null;

  // Handle status change actions
  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      // Send a PATCH request to update the appointment status
      const response = await axios.patch(`/api/appointments`, {
        id: appointmentId,
        status: status,
      });

      if (response.status === 200) {
        toast.success(`Appointment status updated to ${status}`);
        // Refresh the appointment list after updating the status
        fetchAppointments(selectedStatus);
      } else {
        toast.success("Error updating status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.success("Error updating status");
    }
  };

  const renderActionButtons = () => {
    switch (user.status?.toLowerCase()) {
      case "approved":
        return (
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
            onClick={() => handleStatusUpdate(user, "Declined")}
          >
            Decline
            <CircleX />
          </button>
        );
      case "declined":
        return null;
      default:
        return (
          <div className="flex gap-2">
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
              onClick={() => handleStatusUpdate(user, "Declined")}
            >
              Decline
              <CircleX />
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg"
              onClick={() => handleStatusUpdate(user, "Approved")}
            >
              Approve
              <CircleCheck />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="p-4 rounded-lg bg-[#F7FAFF] text-black dark:bg-[#F7FAFF]">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <button
            onClick={onClose}
            className="self-end md:self-auto bg-[#037D40] dark:bg-[#037D40] p-1 rounded-full"
          >
            <CircleChevronUp size={24} className="text-white" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#037D40] dark:text-[#037D40]" />
            <span className="font-bold">Name:</span> {user.name}
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#037D40] dark:text-[#037D40]" />
            <span className="font-bold">Date:</span>{" "}
            {new Date(user.selectedDate).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#037D40] dark:text-[#037D40]" />
            <span className="font-bold">Time:</span>{" "}
            {user.selectedTime?.value || user.selectedTime}
          </div>

          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#037D40] dark:text-[#037D40]" />
            <span className="font-bold">Status:</span> {user.status}
          </div>

          {user.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#037D40] dark:text-[#037D40]" />
              <span className="font-bold">Location:</span> {user.location}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <span className="font-bold">Description:</span>
          <p className="text-sm">{user.appointmentDetails}</p>
        </div>

        {/* Contact and Action Buttons */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:space-y-0">
          {/* Contact Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => toast.success(`Calling ${user.phone}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg"
            >
              <Phone size={20} />
              <span className="text-sm">{user.phone}</span>
            </button>

            <button
              onClick={() => toast.success(`Emailing ${user.email}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg"
            >
              <Mail size={20} />
              <span className="text-sm truncate max-w-[200px]">
                {user.email}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end">{renderActionButtons()}</div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default UserDescription;
