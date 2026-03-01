//dashboard/my-bookings/dataGrid

"use client";

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect, useCallback } from "react";
import { Button, Box, CircularProgress, Typography } from "@mui/material";
import {
  Phone,
  Mail,
  CircleX,
  CircleCheck,
  CircleChevronDown,
} from "lucide-react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useMediaQuery } from "@mui/material";
import { Select, MenuItem } from "@mui/material";
import UserDescription from "../../../components/UserDescription";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CustomizedDataGrid() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const rowsPerPage = isMobile ? 5 : 10;
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUserDescription, setShowUserDescription] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const actualPageSize = Math.min(appointments.length, rowsPerPage);
  const [expandedRowIndex, setExpandedRowIndex] = useState(null);

  // const toggleUserDescription = (user) => {
  //   setSelectedUser(user);
  //   setShowUserDescription((prev) => !prev);
  // };
  const toggleUserDescription = (user, index) => {
    if (expandedRowIndex === index) {
      // If clicking on the same row, close it
      setSelectedUser(null);
      setShowUserDescription(false);
      setExpandedRowIndex(null);
    } else {
      // If clicking on a different row, show its details
      setSelectedUser(user);
      setShowUserDescription(true);
      setExpandedRowIndex(index);
    }
  };

  // Function to fetch appointments based on status
  const fetchAppointments = useCallback(
    async (status) => {
      if (!session?.user?.id) {
        console.error("User session is not available");
        return;
      }

      try {
        setLoading(true);
        setSelectedStatus(status);

        // Ensure the correct parameters are used (coachId from session and status)
        const response = await axios.get(`/api/appointments`, {
          params: {
            coachId: session.user.id,
            status: status,
          },
        });

        // Check for successful response
        if (response.data) {
          setAppointments(response.data);
        } else {
          console.error("No data returned from API.");
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id],
  );

  // Handle status change actions
  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      // Send a PATCH request to update the appointment status
      const response = await axios.patch(`/api/appointments`, {
        id: appointmentId,
        status: status,
      });

      if (response.status === 200) {
        if (status === "Declined") {
          toast.error("Appointment declined.", {
            style: { background: "#D50000", color: "#fff" },
            progressStyle: { background: "#fff" },
          });
        } else {
          toast.success("Appointment approved successfully.");
        }
        // Refresh the appointment list after updating the status
        fetchAppointments(selectedStatus);
      } else {
        toast.error(
          status === "Declined"
            ? "Failed to decline appointment."
            : "Failed to approve appointment.",
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(
        status === "Declined"
          ? "Failed to decline appointment."
          : "Failed to approve appointment.",
      );
    }
  };

  const columns = [
    {
      field: "Name",
      flex: 1.5,
      minWidth: 120,
      align: "center",
      fontFamily: "Kanit, sans-serif",
      renderCell: (params) => (
        <Typography
          variant="body1"
          fontWeight="500"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            height: "100%",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {params.row.name}
        </Typography>
      ),
    },
    {
      field: "Email",
      flex: 1.5,
      fontFamily: "Kanit, sans-serif",
      minWidth: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            height: "100%",
            justifyContent: "center",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <FaEnvelope size={18} color="#28a745" />
          <Typography>{params.row.email}</Typography>
        </Box>
      ),
    },
    {
      field: "Contact",
      flex: 1,
      fontFamily: "Kanit, sans-serif",
      minWidth: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            height: "100%",
            justifyContent: "center",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <FaPhoneAlt size={18} color="#28a745" />
          <Typography>{params.row.phone}</Typography>
        </Box>
      ),
    },
    {
      field: "Date",
      flex: 1,
      fontFamily: "Kanit, sans-serif",
      minWidth: 100,
      headerAlign: "center",

      renderCell: (params) => (
        <Typography
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {new Date(params.row.selectedDate).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: "Time",
      flex: 0.5,
      fontFamily: "Kanit, sans-serif",
      minWidth: 140,
      headerAlign: "center",
      renderCell: (params) => (
        <Typography
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {params.row.selectedTime?.value ?? params.row.selectedTime}
        </Typography>
      ),
    },

    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      fontFamily: "Kanit, sans-serif",
      justifyContent: "center",
      minWidth: 250,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        // Return empty Box if status is "Declined"
        if (params.row.status?.toLowerCase() === "declined") {
          return <Box sx={{ width: "100%", height: "100%" }} />;
        }

        // For mobile view
        if (isMobile) {
          // Only show decline option if status is "Approved"
          if (params.row.status?.toLowerCase() === "approved") {
            return (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <Select
                  value={params.row.status || ""}
                  onChange={(e) =>
                    handleStatusUpdate(params.row._id, e.target.value)
                  }
                  sx={{
                    minWidth: 120,
                    height: "36px",
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  }}
                >
                  <MenuItem value="Declined">
                    <CircleX size={24} color="#D50000" />
                  </MenuItem>
                </Select>
              </Box>
            );
          }

          // Show both options for pending status
          return (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <Select
                value={params.row.status || ""}
                onChange={(e) =>
                  handleStatusUpdate(params.row._id, e.target.value)
                }
                sx={{
                  minWidth: 120,
                  height: "36px",
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                }}
              >
                <MenuItem value="Declined">
                  <CircleX size={24} color="#D50000" />
                </MenuItem>
                <MenuItem value="Approved">
                  <CircleCheck size={24} color="#037D40" />
                </MenuItem>
              </Select>
            </Box>
          );
        }

        // For desktop view
        // Only show decline button if status is "Approved"
        if (params.row.status?.toLowerCase() === "approved") {
          return (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
            >
              <Button
                sx={{
                  bgcolor: "#D50000",
                  color: "white",
                  "&:hover": { bgcolor: "#B20000" },
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "8px 16px",
                }}
                size="small"
                onClick={() => handleStatusUpdate(params.row._id, "Declined")}
              >
                <CircleX /> Decline
              </Button>
            </Box>
          );
        }

        // Show both buttons for pending status
        return (
          <Box
            sx={{
              display: "flex",
              gap: 1,
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
                "&:hover": { bgcolor: "#B20000" },
                height: "36px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 16px",
                fontFamily: "Kanit, sans-serif",
              }}
              size="small"
              onClick={() => handleStatusUpdate(params.row._id, "Declined")}
            >
              <CircleX /> Decline
            </Button>
            <Button
              sx={{
                bgcolor: "#037D40",
                color: "white",
                "&:hover": { bgcolor: "#025b2e" },
                height: "36px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "8px 16px",
                fontFamily: "Kanit, sans-serif",
              }}
              size="small"
              onClick={() => handleStatusUpdate(params.row._id, "Approved")}
            >
              <CircleCheck /> Approve
            </Button>
          </Box>
        );
      },
    },
    {
      field: "details",
      headerName: "",
      minWidth: 50,
      renderCell: (params) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Button
            // onClick={() => toggleUserDescription(params.row)}
            onClick={() => toggleUserDescription(params.row, params.row._id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#037D40",
              border: "none",
              padding: "0",
              cursor: "pointer",
              marginRight: "8px",
              fontFamily: "Kanit, sans-serif",
            }}
          >
            <CircleChevronDown
              size={30}
              style={{
                color: "#fff",
                padding: "6px",
                backgroundColor: "#037D40",
                transform:
                  expandedRowIndex === params.row._id
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                transition: "transform 0.3s ease",
              }}
            />
          </Button>
        </div>
      ),
    },
  ];

  const styles = {
    customRowSpacing: {
      "& .MuiDataGrid-row": {
        marginBottom: "10px",
      },
    },
  };

  // Initial fetch for "pending" appointments
  useEffect(() => {
    fetchAppointments("pending");
  }, [fetchAppointments]); // Add fetchAppointments to the dependency array

  return (
    <Box sx={{ width: "100%", paddingTop: 15 }}>
      {/* Header and Status Buttons */}
      <Box
        display="flex"
        justifyContent="space-between"
        pb={10}
        sx={{
          fontFamily: "Kanit, sans-serif",
        }}
      >
        <Typography
          variant="h6"
          color="black"
          fontWeight="bold "
          sx={{
            fontFamily: "Kanit, sans-serif",
            fontSize: "22px",
            pr: { xs: 8, sm: 4 },
          }}
        >
          My Bookings
        </Typography>
        <Box display="flex" gap={2}>
          {isMobile ? (
            // Render a dropdown for mobile view
            <Select
              value={selectedStatus || ""}
              onChange={(e) => fetchAppointments(e.target.value)}
              displayEmpty
              sx={{
                bgcolor: "#037D40",
                color: "white",
                px: 1,
                fontWeight: "bold",

                minWidth: 130,
                width: "100%",
                fontSize: "16px",

                fontFamily: "Kanit, sans-serif",

                "&:hover": {
                  bgcolor: "#c6e7d3",
                  color: "#037D40",
                },
                // "& .MuiOutlinedInput-notchedOutline": {
                //   borderColor: "#037D40", // Border color
                // },
                "& .MuiSvgIcon-root": {
                  color: "white",
                },
                "&:hover .MuiSvgIcon-root": {
                  color: "#037D40",
                },
                "& .MuiMenuItem-root": {},
                "& .MuiMenuItem-root.Mui-selected": {
                  backgroundColor: "#D6F5DC",
                  color: "#037D40",
                },
                // Mobile responsiveness: Adjust styles on smaller screens
                "@media (max-width: 600px)": {
                  minWidth: 110,
                  fontSize: "14px",
                  px: 1,
                },
              }}
            >
              {["pending", "Approved", "Declined"].map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          ) : (
            // Render buttons for larger screens
            ["pending", "Approved", "Declined"].map((status) => (
              <Button
                key={status}
                onClick={() => fetchAppointments(status)}
                sx={{
                  bgcolor: selectedStatus === status ? "#037D40" : "#E6F2EC",
                  color: selectedStatus === status ? "white" : "#037D40",
                  px: 3,
                  fontFamily: "Kanit, sans-serif",
                  fontWeight: "bold",
                  "&:hover": { bgcolor: "#037D40", color: "white" },
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))
          )}
        </Box>
      </Box>

      {/* Loading Spinner */}
      {loading && (
        <Box display="flex" justifyContent="center" mt={2}>
          <CircularProgress sx={{ color: "#037D40" }} />
        </Box>
      )}

      {/* No Data Message */}
      {!loading && appointments.length === 0 && selectedStatus && (
        <Typography
          sx={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "18px",
            fontFamily: "Kanit, sans-serif",
          }}
          textAlign="center"
          mt={3}
          color="textSecondary"
        >
          No {selectedStatus.toLowerCase()} appointments found.
        </Typography>
      )}

      {/* Data Grid */}
      {!loading && appointments.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <DataGrid
            rows={appointments}
            columns={columns}
            getRowId={(row) => row._id}
            disableSelectionOnClick
            autoHeight
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
            }}
            pageSizeOptions={[10, 20, 50]}
            pagination
            density="comfortable"
            disableColumnMenu
            sx={{
              border: "none",
              "& .MuiDataGrid-row": {
                backgroundColor: "#fff",
                "&:nth-of-type(odd)": {
                  backgroundColor: "#f8f9fa",
                },
                "&:hover": {
                  backgroundColor: "#f0f0f0",
                },
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #e0e0e0",
                padding: "16px",

                "&:focus": {
                  outline: "none",
                },
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f8f9fa",
                borderBottom: "2px solid #e0e0e0",
                fontFamily: "Kanit, sans-serif",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "2px solid #e0e0e0",
                fontFamily: "Kanit, sans-serif",
              },
              "& .MuiDataGrid-virtualScrollerRenderZone": {
                "& .MuiDataGrid-row": {
                  "&:not(:last-child)": {
                    marginBottom: "8px",
                    fontFamily: "Kanit, sans-serif",
                  },
                },
                "& .MuiDataGrid-row": {
                  "&:(:last-child)": {
                    marginBottom: "8px",
                    fontFamily: "Kanit, sans-serif",
                  },
                },
              },
              "& .MuiDataGrid-virtualScroller": {
                overflow: "auto",
                paddingBottom: "18px",
                fontFamily: "Kanit, sans-serif",

                "&::-webkit-scrollbar": {
                  width: "8px",
                  height: "8px",
                  fontFamily: "Kanit, sans-serif",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f1f1f1",
                  fontFamily: "Kanit, sans-serif",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#888",
                  borderRadius: "4px",
                  fontFamily: "Kanit, sans-serif",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: "#555",
                  marginTop: "10px",
                },
              },
            }}
          />
        </div>
      )}

      {/* User Description Panel */}
      {showUserDescription && selectedUser && (
        <UserDescription
          user={selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setShowUserDescription(false);
            setExpandedRowIndex(null);
          }}
        />
      )}

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
    </Box>
  );
}
