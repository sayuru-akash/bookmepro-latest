// components/CustomizedDataGrid.js

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { CircleX, CircleCheck } from "lucide-react";
import axios from "axios"; 
import { useSession } from "next-auth/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function CustomizedDataGrid() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(1024);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 5,
  });
  const { data: session } = useSession();
  const isSmallScreen = viewportWidth < 600;
  const isMobileScreen = viewportWidth < 768;
  const isVerySmallScreen = viewportWidth < 400;

  const handleAction = useCallback(async (row, newStatus) => {
    try {
      const response = await axios.patch("/api/appointments", {
        id: row.id,
        status: newStatus,
      });

      if (response.status === 200) {
        setRows((prevRows) => {
          const updatedRows = prevRows.filter((r) => r.id !== row.id);

          // Adjust pagination if current page becomes empty
          setPaginationModel((prev) => {
            const totalPages = Math.ceil(updatedRows.length / prev.pageSize);
            const nextPage =
              prev.page >= totalPages && totalPages > 0
                ? totalPages - 1
                : prev.page;
            return { ...prev, page: nextPage };
          });

          return updatedRows;
        });

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
              icon: <CircleCheck color="#037D40" />, 
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
            icon: <CircleX color="#d50000" />,
            fontFamily: "Kanit, sans-serif",
          });
        }

        console.log(`Appointment ${newStatus.toLowerCase()} successfully.`);
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
  }, []);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session || !session.user || !session.user.id) return; // Ensure session and user data are available
      try {
        const response = await axios.get(
          `/api/appointments?coachId=${session.user.id}&status=pending`
        );
        const data = response.data;

        // Define columns with improved responsiveness
        const columns = [
          { 
            field: "name", 
            headerName: "Name", 
            flex: 1, 
            minWidth: 120,
            fontFamily: "Kanit, sans-serif",
          },
          { 
            field: "email", 
            headerName: "Email", 
            flex: 1.2, 
            minWidth: 150,
            fontFamily: "Kanit, sans-serif",
            hide: isMobileScreen, // Hide on mobile
          },
          { 
            field: "phone", 
            headerName: "Phone", 
            flex: 1, 
            minWidth: 120,
            fontFamily: "Kanit, sans-serif",
            hide: isSmallScreen, // Hide on small screens
          },
          { 
            field: "date", 
            headerName: "Date", 
            flex: 0.8, 
            minWidth: 100,
            fontFamily: "Kanit, sans-serif",
          },
          { 
            field: "time", 
            headerName: "Time", 
            flex: 0.8, 
            minWidth: 80,
            fontFamily: "Kanit, sans-serif",
          },
          {
            field: "actions",
            headerName: "Actions",
            headerAlign: "center",
            flex: 1.5,
            minWidth: 180,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
              <div
                style={{
                  display: "flex",
                  gap: isSmallScreen ? "4px" : "8px",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  fontFamily: "Kanit, sans-serif",
                  flexWrap: isVerySmallScreen ? "wrap" : "nowrap",
                }}
              >
                <Button
                  sx={{
                    bgcolor: "#D50000",
                    color: "white",
                    px: isSmallScreen ? 1 : 2,
                    py: 0.5,
                    minWidth: isSmallScreen ? "auto" : "80px",
                    fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                    "&:hover": { bgcolor: "#B20000" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isSmallScreen ? 0.5 : 1,
                    fontFamily: "Kanit, sans-serif",
                  }}
                  size="small"
                  onClick={() => handleAction(params.row, "Declined")}
                >
                  {isSmallScreen ? "" : "Decline"}
                  <CircleX size={isSmallScreen ? 16 : 20} />
                </Button>
                <Button
                  sx={{
                    bgcolor: "#037D40",
                    color: "white",
                    px: isSmallScreen ? 1 : 2,
                    py: 0.5,
                    minWidth: isSmallScreen ? "auto" : "80px",
                    fontSize: isSmallScreen ? "0.75rem" : "0.875rem",
                    "&:hover": { bgcolor: "#025b2e" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: isSmallScreen ? 0.5 : 1,
                    fontFamily: "Kanit, sans-serif",
                  }}
                  size="small"
                  onClick={() => handleAction(params.row, "Approved")}
                >
                  {isSmallScreen ? "" : "Approve"}
                  <CircleCheck size={isSmallScreen ? 16 : 20} />
                </Button>
              </div>
            ),
          },
        ];

        // Map data to the format expected by DataGrid
        const formattedRows = data.map((appointment, index) => ({
          id: appointment._id, // Use unique MongoDB ID as the row ID
          name: appointment.name,
          email: appointment.email,
          phone: appointment.phone,
          date: new Date(appointment.selectedDate).toLocaleDateString(),
          time: appointment.selectedTime?.value,
          status: appointment.status || "Pending",
        }));

        setRows(formattedRows);
        setColumns(columns);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, [session, handleAction, isMobileScreen, isSmallScreen, isVerySmallScreen]);

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  return (
    <div style={{ 
      height: "auto", 
      width: "100%", 
      minHeight: "500px",
      padding: "0 8px"
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        padding: '0 8px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h2 style={{ 
          fontSize: isSmallScreen ? '1.1rem' : '1.25rem',
          fontWeight: 700,
          margin: 0,
          fontFamily: "Kanit, sans-serif",
        }}>
          Latest Booking Requests
        </h2>
        <a href="/dashboard/my-bookings" style={{ 
          color: '#037D40', 
          textDecoration: 'none',
          fontSize: isSmallScreen ? '0.9rem' : '1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          fontFamily: "Kanit, sans-serif",
        }}>
          View All
          <span style={{ marginLeft: '4px' }}>→</span>
        </a>
      </div>

      {rows.length > 0 ? (
        <div style={{ 
          width: '100%', 
          height: 'auto',
          fontFamily: "Kanit, sans-serif",
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <DataGrid
            checkboxSelection={false}
            rows={rows}
            columns={columns}
            rowHeight={isSmallScreen ? 70 : 60}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            pageSizeOptions={[5]}
            disableColumnResize
            density="comfortable"
            disableColumnMenu
            disableColumnFilter
            disableColumnSelector
            disableRowSelectionOnClick
            autoHeight
            sx={{ 
              border: 'none',
              backgroundColor: 'white',
              fontFamily: "Kanit, sans-serif",
              minHeight: 400,
              // Fix for last row visibility
              '& .MuiDataGrid-virtualScrollerContent': {
                paddingBottom: '20px !important', 
              },
              '& .MuiDataGrid-root': {
                backgroundColor: 'white'
              },
              '& .MuiDataGrid-main': {
                backgroundColor: 'white',
                fontFamily: "Kanit, sans-serif",
              },
              '& .MuiDataGrid-row': {
                // backgroundColor: '#F7FAFF',
                marginTop: '1px',
                marginBottom: '1px',
                borderRadius: '8px',
                fontFamily: "Kanit, sans-serif",
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: '#E6F2EC',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease-in-out'
                },
                '&:last-child': {
                  marginBottom: 'px',
                },
              },
              '& .MuiDataGrid-cell': {
                border: 'none',
                fontSize: isSmallScreen ? '0.8rem' : '0.875rem',
                fontFamily: "Kanit, sans-serif",
                padding: isSmallScreen ? '0 4px' : '0 16px',
                '&:focus': {
                  outline: 'none'
                },
                '&:focus-within': {
                  outline: 'none'
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8fafc',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                fontFamily: "Kanit, sans-serif",
                fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
                fontWeight: 800,
                color: '#037D40',
                '& .MuiDataGrid-columnHeader': {
                  padding: isSmallScreen ? '8px 4px' : '12px 16px',
                  '&:focus': {
                    outline: 'none'
                  },
                  '&:focus-within': {
                    outline: 'none'
                  }
                }
              },
              '& .MuiDataGrid-virtualScroller': {
                backgroundColor: 'white',
                fontFamily: "Kanit, sans-serif",
              },
              '& .MuiDataGrid-virtualScrollerContent': {
                fontFamily: "Kanit, sans-serif",
                padding: '2px',
              },
              '& .MuiDataGrid-footerContainer': {
                backgroundColor: '#f8fafc',
                border: 'none',
                borderRadius: '0 0 8px 8px',
                fontFamily: "Kanit, sans-serif",
                '& .MuiTablePagination-root': {
                  fontFamily: "Kanit, sans-serif",
                  fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontFamily: "Kanit, sans-serif",
                  fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
                },
                '& .MuiIconButton-root': {
                  color: '#037D40',
                  '&:hover': {
                    backgroundColor: 'rgba(3, 125, 64, 0.1)',
                  },
                  '&.Mui-disabled': {
                    color: '#9CA3AF',
                  }
                }
              },
              '& .MuiDataGrid-selectedRowCount': {
                display: 'none',
              },
              // Responsive scrollbars
              '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
                height: '6px',
                width: '6px'
              },
              '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '3px'
              },
              '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
                backgroundColor: '#037D40',
                borderRadius: '3px',
                '&:hover': {
                  backgroundColor: '#025b2e'
                }
              }
            }}
          />
        </div>
      ) : (
        <div
          style={{ 
            textAlign: "center", 
            marginTop: "20px", 
            fontSize: isSmallScreen ? "16px" : "18px",
            fontFamily: "Kanit, sans-serif",
            color: "#6B7280",
            backgroundColor: "#E6F2EC",
            padding: "40px 20px",
            borderRadius: "12px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ 
            fontSize: isSmallScreen ? "48px" : "64px",
            marginBottom: "16px",
            opacity: 0.5 
          }}>
            📅
          </div>
          No appointments available at the moment.
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{
          fontFamily: "Kanit, sans-serif"
        }}
      />
    </div>
  );
}
