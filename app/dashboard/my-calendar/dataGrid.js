"use client";

import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";
import { Button, Card, CardContent } from "@mui/material";
import {
  Phone,
  Mail,
  CircleX,
  CircleCheck,
  CircleChevronDown,
} from "lucide-react";
import UserDescription from "../../../components/UserDescription";
import axios from "axios"; 

const styles = {
  customRowSpacing: {
    "& .MuiDataGrid-row": {
      // marginBottom: "10px", 
    },
  },
};

export default function CustomizedDataGrid({ selectedDate, coachId }) {
  const [showUserDescription, setShowUserDescription] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleUserDescription = (user) => {
    setSelectedUser(user);
    setShowUserDescription((prev) => !prev);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDate || !coachId) return; // Ensure both values are present

      // Format the selected date for comparison
      const selectedDateFormatted = dayjs(selectedDate).format("YYYY-MM-DD");

      try {
        const response = await axios.get(
          `/api/appointments?coachId=${coachId}&selectedDate=${selectedDateFormatted}`
        );
        // const appointments = response.data;

        setRows(response.data); // Set the filtered rows
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false); // Reset loading state
      }
    };

    fetchAppointments();
  }, [selectedDate, coachId]);
  if (isLoading) {
    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          flexGrow: 1,
          alignItems: "center",
          color: "#000000",
          fontFamily: "Kanit, sans-serif",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%", 
            padding: "0 !important",
          }}
        >
          <span className="loader"></span>{" "}
          {/* Add your loader component here */}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showUserDescription && selectedUser && (
        <UserDescription
          user={selectedUser}
          onClose={() => setShowUserDescription(false)}
        />
      )}
      <MyDataGrid rows={rows} toggleUserDescription={toggleUserDescription} />
    </>
  );
}

// MyDataGrid Component
function MyDataGrid({ rows, toggleUserDescription }) {
  return (
    <div style={{ height: 350, width: "100%", padding: "10px" }}>
      <DataGrid
        rows={rows}
        columns={columns(toggleUserDescription)}
        getRowId={(row) => row.id}
        sx={styles.customRowSpacing}
      />
    </div>
  );
}

// Column definitions
export const columns = (toggleUserDescription) => [
  { field: "Name", headerName: "Name", flex: 1.5, minWidth: 200 },
  {
    field: "status",
    headerName: "Status",
    flex: 0.5,
    minWidth: 90,
    renderCell: (params) => renderStatus(params.value),
  },
  {
    field: "Date",
    headerName: "Date",
    headerAlign: "right",
    align: "right",
    flex: 1,
    minWidth: 80,
  },
  {
    field: "eventCount",
    headerName: "Event Count",
    headerAlign: "right",
    align: "right",
    flex: 1,
    minWidth: 50,
  },
  {
    field: "contact",
    headerName: "Contact",
    headerAlign: "center",
    flex: 0.5,
    minWidth: 200,
    renderCell: (params) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            border: "1",
            borderColor: "#037D40",
            padding: "0",
            cursor: "pointer",
            marginRight: "8px",
          }}
        >
          <Phone
            size={29}
            style={{
              color: "#037D40",
              backgroundColor: "#fff",
              borderRadius: "20%",
              border: "2px solid #037D40",
              padding: "5px",
            }}
          />
        </button>
        {params.value}
        <button
          style={{
            display: "flex",
            alignItems: " center",
            justifyContent: "center",
            backgroundColor: "transparent",
            border: "none",
            padding: "0",
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          <Mail
            size={29}
            style={{
              color: "#037D40",
              backgroundColor: "#fff",
              borderRadius: "20%",
              border: "2px solid #037D40",
              padding: "5px",
            }}
          />
        </button>
      </div>
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    headerAlign: "center",
    flex: 0.5,
    minWidth: 300,
    renderCell: () => (
      <div
        style={{
          display: "flex",
          gap: "8px",
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
            px: 2,
            py: 0.5,
            "&:hover": { bgcolor: "#B20000" },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
          }}
          size="small"
          onClick={() => alert("Declined")}
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
          }}
          size="small"
          onClick={() => alert("Accepted")}
        >
          Approve
          <CircleCheck sx={{ color: "white", fill: "white" }} />
        </Button>
      </div>
    ),
  },
  {
    headerAlign: "center",
    flex: 0.5,
    minWidth: 200,
    renderCell: (params) => (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <button
          onClick={() => toggleUserDescription(params.row)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#037D40",
            border: "none",
            padding: "0",
            cursor: "pointer",
            marginRight: "8px",
          }}
        >
          <CircleChevronDown
            size={30}
            style={{
              color: "#fff",
              padding: "6px",
              backgroundColor: "#037D40",
            }}
          />
        </button>
      </div>
    ),
  },
];

export const rows = [
  {
    id: 1,
    Name: "Homepage Overview",
    status: "Approved",
    Date: "2024-04-10",
    Time: "22.00",
    eventCount: 8345,
  },
  {
    id: 2,
    Name: "Product Details - Gadgets",
    status: "Declined",
    Date: "2024-04-12",
    Time: "22.00",
    eventCount: 5653,
  },
  {
    id: 3,
    Name: "Checkout Process - Step 1",
    status: "Pending",
    Date: "2024-04-15",
    Time: "22.00",
    eventCount: 3455,
  },
];
