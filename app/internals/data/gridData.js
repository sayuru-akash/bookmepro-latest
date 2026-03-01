import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid"; // Ensure you import DataGrid
import { Phone, Mail } from "lucide-react";
import Button from "@mui/material/Button";
import { CircleX, CircleCheck } from "lucide-react";
import Chip from "@mui/material/Chip";

// Function to render status
function renderStatus(status) {
  const colors = {
    Approved: "success",
    Declined: "default",
    Pending: "default",
  };

  return <Chip label={status} color={colors[status]} size="small" />;
}

// Column definitions
const columns = [
  { field: "name", headerName: "Name", flex: 1.5, minWidth: 200 },
  { field: "email", headerName: "Email", flex: 1, minWidth: 150 },
  { field: "phone", headerName: "Phone", flex: 1, minWidth: 150 },
  { field: "date", headerName: "Date", flex: 1, minWidth: 100 },
  { field: "time", headerName: "Time", flex: 1, minWidth: 100 },
  {
    field: "status",
    headerName: "Status",
    flex: 0.5,
    minWidth: 90,
    renderCell: (params) => renderStatus(params.value),
  },
  {
    field: "contact",
    headerName: "Contact",
    headerAlign: "center",
    flex: 0.5,
    minWidth: 200,
    renderCell: (params) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button onClick={() => alert(`Calling ${params.row.phone}`)} style={{ marginRight: "8px" }}>
          <Phone size={20} />
        </button>
        <span style={{ marginRight: "8px" }}>{params.row.phone}</span>
        <button onClick={() => alert(`Emailing ${params.row.email}`)}>
          <Mail size={20} />
        </button>
      </div>
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    headerAlign: "center",
    flex: 0.5,
    minWidth: 200,
    renderCell: () => (
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <Button variant="contained" color="error" onClick={() => alert("Declined")}>
          Decline
          <CircleX />
        </Button>
        <Button variant="contained" color="success" onClick={() => alert("Accepted")}>
          Approve
          <CircleCheck />
        </Button>
      </div>
    ),
  },
];

export default function MyDataGrid() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch("/api/appointments");
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        const data = await response.json();
        
        // Map data to the format expected by DataGrid
        const formattedRows = data.map((appointment, index) => ({
          id: index + 1, // Assign a unique ID
          name: appointment.name,
          email: appointment.email,
          phone: appointment.phone,
          date: new Date(appointment.selectedDate).toLocaleDateString(), // Format date
          time: new Date(appointment.selectedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), // Format time
          status: appointment.status || "Pending", // Default to "Pending" if no status
        }));

        setRows(formattedRows);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

  return (
    <div style={{ height: 500, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        pageSize={5}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </div>
  );
}
