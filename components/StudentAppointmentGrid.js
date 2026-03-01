// components/CustomizedDataGrid.js

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useState } from "react";
import Button from "@mui/material/Button";
import { CircleX, CircleCheck } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StudentAppointmentGrid() {
  // Sample static data instead of API fetching
  const [rows, setRows] = useState([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      date: '03/21/2025',
      time: '10:00 AM',
      status: 'Pending'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '987-654-3210',
      date: '03/22/2025',
      time: '2:30 PM',
      status: 'Pending'
    }
  ]);

  const columns = [
    { field: "name", headerName: "Name", flex: 0.6, minWidth: 80, fontFamily: "Kanit, sans-serif" },
    { field: "email", headerName: "Email", flex: 0.6, minWidth: 80, fontFamily: "Kanit, sans-serif" },
    { field: "phone", headerName: "Phone", flex: 0.6, minWidth: 80, fontFamily: "Kanit, sans-serif" },
    { field: "date", headerName: "Date", flex: 0.5, minWidth: 70, fontFamily: "Kanit, sans-serif" },
    { field: "time", headerName: "Time", flex: 0.5, minWidth: 70, fontFamily: "Kanit, sans-serif" },
    {
      field: "actions",
      headerName: "Actions",
      headerAlign: "center",
      flex: 1,
      minWidth: 150,
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

  const handleAction = (row, newStatus) => {
    // Remove the updated row from the DataGrid (frontend only)
    setRows((prevRows) => prevRows.filter((r) => r.id !== row.id));

    // Show toast notification
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
  };

  return (
    <div style={{ height: 500, width: "100%" }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '0 16px'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 700,
          margin: 0
        }}>
          Latest Booking Requests
        </h2>
        <a href="/dashboard/my-bookings" style={{ 
          color: '#037D40', 
          textDecoration: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center'
        }}>
          View All
          <span style={{ marginLeft: '4px' }}>→</span>
        </a>
      </div>

      {rows.length > 0 ? (
        <div style={{ width: '100%', overflowX: 'auto', overflowY: 'auto', fontFamily: "Kanit, sans-serif" }}>
          <DataGrid
            autoHeight
            checkboxSelection={false}
            rows={rows}
            columns={columns}
            rowHeight={50}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
            }
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
            }}
            pageSizeOptions={[10, 20, 50]}
            disableColumnResize
            density="comfortable"
            disableColumnMenu
            disableColumnFilter
            disableColumnSelector
            sx={{ 
              border: 'none',
              backgroundColor: 'white',
              fontFamily: "Kanit, sans-serif",
              '& .MuiDataGrid-root': {
                backgroundColor: 'white',
              },
              '& .MuiDataGrid-main': {
                backgroundColor: 'white',
                fontFamily: "Kanit, sans-serif",
              },
              '& .MuiDataGrid-row': {
                backgroundColor: '#F7FAFF',
                marginTop: '8px',
                marginBottom: '8px',
                borderRadius: '8px',
                fontFamily: "Kanit, sans-serif",
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                },
                "&:(:last-child)": {
                  marginBottom: "5px",
                  fontFamily: "Kanit, sans-serif",
                },
              },
              '& .MuiDataGrid-cell': {
                border: 'none',
                '&:focus': {
                  outline: 'none'
                },
                '&:focus-within': {
                  outline: 'none'
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                display: 'none',
              },
              '& .MuiDataGrid-virtualScroller': {
                marginTop: '0 !important',
                height: 'auto !important',
                backgroundColor: 'white',
                fontFamily: "Kanit, sans-serif",
              },
              '& .MuiDataGrid-virtualScrollerContent': {
                height: 'auto !important',
                fontFamily: "Kanit, sans-serif",
                minWidth: '100%',
                marginBottom: '60px', 
              },
              '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
                display: 'block',
                fontFamily: "Kanit, sans-serif",
              }
            }}
          />
        </div>
      ) : (
        <div
          style={{ textAlign: "center", marginTop: "20px", fontSize: "18px", fontFamily: "Kanit, sans-serif" }}
        >
          No appointments available.
        </div>
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
    </div>
  );
}