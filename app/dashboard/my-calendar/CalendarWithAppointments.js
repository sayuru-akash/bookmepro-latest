//dashboard/my-calendar/Calendarwith Appointments

"use client";

import { useState, useEffect, useMemo } from "react";

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import axios from "axios";
import { Phone, Mail, CircleX, CircleCheck } from "lucide-react";
import { Button } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { render } from "preact/compat";

const CalendarWithAppointments = () => {
  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [daysGrid, setDaysGrid] = useState([]);
  const [rows, setRows] = useState([]);
  const { data: session } = useSession();

  // Appointments states
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch appointments when date is selected
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session || !session.user || !session.user.id) return;
      if (!selectedDate) return;

      setIsLoading(true);
      const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");

      try {
        const response = await axios.get(
          `/api/calendar?coachId=${session.user.id}&selectedDate=${formattedDate}`
        );

        const transformedAppointments = response.data.map((appointment) => {
          return {
            ...appointment,
            id: appointment._id, // Map MongoDB _id to id
            Name: appointment.name,
            Date: appointment.selectedDate, // Correctly map selectedDate to Date
            Time: appointment.selectedTime?.value,
            status: appointment.status,
          };
        });
        setAppointments(transformedAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDate, session]);

  const handleDateClick = (date) => {
    const newSelectedDate = new Date(currentYear, currentMonth, date);
    setSelectedDate(newSelectedDate);
  };

  // Calendar navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Update calendar grid when month/year changes
  useEffect(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let grid = Array(35).fill(null);
    for (let i = 0; i < daysInMonth; i++) {
      grid[i + firstDay] = i + 1;
    }
    setDaysGrid(grid);
  }, [currentMonth, currentYear]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleAction = async (row, newStatus) => {
    try {
      const response = await axios.patch("/api/calendar", {
        id: row.id,
        status: newStatus,
      });

      if (response.status === 200) {
        // Remove the updated row from the DataGrid
        setRows((prevRows) => prevRows.filter((r) => r.id !== row.id));

        // Customize the toast message based on status
        if (newStatus === "Approved") {
          toast.success(
            `Appointment ${newStatus.toLowerCase()} successfully!`,
            {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: false,
              draggable: false,
              theme: "light",
              icon: <CircleCheck color="#037D40" />, // Green tick icon
              fontFamily: "Kanit, sans-serif",
            }
          );
        } else if (newStatus === "Declined") {
          toast.error(`Appointment ${newStatus.toLowerCase()} successfully!`, {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
            theme: "light",
            icon: <CircleX color="#d50000" />, // Red cross icon
            fontFamily: "Kanit, sans-serif",
          });
        }

        // console.log(`Appointment ${newStatus.toLowerCase()} successfully.`);
      } else {
        toast.error(`Failed to ${newStatus.toLowerCase()} appointment.`, {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          theme: "light",
          fontFamily: "Kanit, sans-serif",
        });

        console.error(`Failed to ${newStatus.toLowerCase()} appointment.`);
      }
    } catch (error) {
      console.error(`Error during ${newStatus.toLowerCase()} action:`, error);
      toast.error(`Error: Unable to ${newStatus.toLowerCase()} appointment.`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        theme: "light",
        fontFamily: "Kanit, sans-serif",
      });
    }
  };

  // DataGrid columns configuration
  const columns = [
    { field: "name", headerName: "Name", flex: 1.5, minWidth: 150, },
    {
      field: "email",
      headerName: "Email",
      fontFamily: "Kanit, sans-serif",
      flex: 1,
      minWidth: 120,
     
    },
    {
      field: "status",
      headerName: "Status",
      fontFamily: "Kanit, sans-serif",
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded ${
            params.value === "Approved"
              ? "bg-green-100 text-green-800"
              : params.value === "Declined"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {params.value}
        </span>
      ),
    },
    {
      field: "phone",
      headerName: "Contact",
      fontFamily: "Kanit, sans-serif",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={() => (window.location.href = `tel:${params.value}`)}
          >
            <Phone className="w-5 h-5 text-primary" />
          </button>
          {params.value}
        </div>
      ),
    },
    {
      field: "Date",
      headerName: "Date",
      fontFamily: "Kanit, sans-serif",
      flex: 1,
      minWidth: 40,
      renderCell: (params) => (
        <span>
          {dayjs(params.value).isValid()
            ? dayjs(params.value).format("MMM D, YYYY")
            : "Invalid Date"}
        </span>
      ),
    },
    {
      field: "Time",
      headerName: "Time",
      flex: 0.5,
      minWidth: 140,
      fontFamily: "Kanit, sans-serif",
    },
    {
      field: "actions",
      headerName: "Actions",
      fontFamily: "Kanit, sans-serif",
      headerAlign: "center",

      flex: 0.5,
      minWidth: 200,

      renderCell: (params) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <Button
            sx={{
              bgcolor: "#D50000",
              color: "white",
              px: 2,
              py: 0.5,
              "&:hover": { bgcolor: "#B20000" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              fontFamily: "Kanit, sans-serif",
            }}
            size="small"
            onClick={() => handleAction(params.row, "Declined")}
          >
            Decline
            <CircleX sx={{ color: "white", fill: "white" }} />
          </Button>
          <Button
            sx={{
              bgcolor: "#037D40",
              color: "white",
              px: 2,
              py: 0.5,
              "&:hover": { bgcolor: "#025b2e" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              fontFamily: "Kanit, sans-serif",
            }}
            size="small"
            onClick={() => handleAction(params.row, "Approved")}
          >
            Approve
            <CircleCheck sx={{ color: "white", fill: "white" }} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-6 sm:px-10 py-0 sm:pt-0 pt-20 sm:py-10">
      <ToastContainer />
      <h2 className="p-6 font-kanit font-bold text-[20px] sm:text-[22px] pb-5 sm:mt-20">
        My Calendar
      </h2>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="border rounded-lg mb-8">
          <div className="flex items-center justify-between border-b p-4">
            <button
              className="w-10 h-10 rounded-full bg-primary text-white hover:bg-primary-dark"
              onClick={handlePrevMonth}
            >
              ←
            </button>
            <h5 className="text-2xl font-semibold text-primary">
              {months[currentMonth]} {currentYear}
            </h5>
            <button
              className="w-10 h-10  rounded-full bg-primary text-white hover:bg-primary-dark"
              onClick={handleNextMonth}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 border-b font-medium text-primary">
                {day}
              </div>
            ))}
            {daysGrid.map((day, idx) => {
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

              const isSelected =
                selectedDate &&
                day === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() &&
                currentYear === selectedDate.getFullYear();
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (day) {
                      handleDateClick(day);
                    }
                  }}
                  className={`p-4 border cursor-pointer hover:bg-gray-50 ${
                    isSelected
                      ? "bg-primary/10 font-bold"
                      : isToday && selectedDate.getDate() === today.getDate()
                      ? "bg-blue-100 font-bold"
                      : ""
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">
              Appointments for {dayjs(selectedDate).format("MMMM D, YYYY")}
            </h3>
            {isLoading ? (
              <div className="text-center py-4">Loading appointments...</div>
            ) : appointments.length > 0 ? (
              <div>
                <DataGrid
                  autoHeight
                  rows={appointments}
                  columns={columns}
                  rowHeight={50}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
                  }
                  initialState={{
                    pagination: { paginationModel: { pageSize: 20 } },
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  disableSelectionOnClick
                  disableColumnMenu
                  density="comfortable"
                  sx={{
                    fontFamily: "Kanit, sans-serif",
                    "& .MuiDataGrid-columnHeaders": {
                      fontFamily: "Kanit, sans-serif",
                      fontWeight: "bold",
                    },
                    "& .MuiDataGrid-cell": {
                      fontFamily: "Kanit, sans-serif",
                    },
                    "& .MuiTablePagination-root": {
                      fontFamily: "Kanit, sans-serif",
                    },
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-4">
                No appointments available for this date.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarWithAppointments;
