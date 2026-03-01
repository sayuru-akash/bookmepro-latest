// app/bmpadmin/dashboard/booking/page.js
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Box, 
  CircularProgress, 
  Container, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  useTheme, 
  useMediaQuery, 
  Alert, 
  Snackbar, 
  TextField, 
  InputAdornment, 
  Stack, 
  ToggleButton, 
  ToggleButtonGroup, 
  IconButton,
  TablePagination,
  createTheme,
  ThemeProvider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

// Custom theme with your color scheme
const customTheme = createTheme({
  palette: {
    primary: {
      main: '#037D40',
      light: '#4CAF50',
      dark: '#025D30',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    secondary: {
      main: '#037D40',
    },
  },
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: '#037D40',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#025D30',
            },
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
        },
        select: {
          '&:focus': {
            backgroundColor: 'transparent',
          },
        },
        selectIcon: {
          color: '#037D40',
        },
        actions: {
          '& .MuiIconButton-root': {
            color: '#037D40',
            '&:hover': {
              backgroundColor: 'rgba(3, 125, 64, 0.1)',
            },
            '&.Mui-disabled': {
              color: 'rgba(3, 125, 64, 0.3)',
            },
          },
        },
      },
    },
  },
});

export default function AdminBookingPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10); // Fixed at 10 rows per page

  // State for the actual search term used in filtering
  const [searchTerm, setSearchTerm] = useState("");
  // State for the input field value (for debouncing)
  const [inputValue, setInputValue] = useState("");
  // State for the filter type
  const [filterType, setFilterType] = useState("student");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(inputValue);
      setPage(0); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, setPage]);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true); // Set loading true when fetching starts
      setError(""); // Clear previous errors
      try {
        const { data } = await axios.get("/api/admin/booking");
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        const message =
          error.response?.data?.message || "Failed to fetch appointments";
        setError(message);
        setSnackbar({
          open: true,
          message: message,
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []); // Fetch on initial mount

  // Filter appointments based on the debounced search term and filter type
  const filteredAppointments = appointments.filter((booking) => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true; // Show all if search term is empty

    if (filterType === "student") {
      return booking.name && booking.name.toLowerCase().includes(searchLower);
    } else if (filterType === "coach") {
      return (
        booking.coachName &&
        booking.coachName.toLowerCase().includes(searchLower)
      );
    }
    return true; // Should not happen with current filter types
  });

  // Get paginated data
  const paginatedAppointments = filteredAppointments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleFilterTypeChange = (event, newFilterType) => {
    // Prevent deselecting all buttons in exclusive mode
    if (newFilterType !== null) {
      setFilterType(newFilterType);
      setPage(0); // Reset to first page when filter changes
      // Optional: Clear search term when changing filter type
      // setInputValue("");
      // setSearchTerm("");
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSearchTerm("");
    setPage(0); // Reset to first page when clearing search
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Render loading state
  if (loading) {
    return (
      <ThemeProvider theme={customTheme}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
          sx={{ backgroundColor: '#ffffff' }}
        >
          <CircularProgress size={60} sx={{ color: '#037D40' }} />
        </Box>
      </ThemeProvider>
    );
  }

  // Render error state (only if not loading and error exists)
  if (!loading && error) {
    return (
      <ThemeProvider theme={customTheme}>
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4, backgroundColor: '#ffffff', minHeight: '100vh', pt: 4 }}>
          <Alert severity="error" sx={{ fontSize: "1.1rem" }}>
            {error}
          </Alert>
        </Container>
      </ThemeProvider>
    );
  }

  // Main Content
  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 1, sm: 1, md: 2 },
            py: 2,
            mt: { xs: 1, sm: 2, md: 2 }, 
          }}
        >
          <Typography
            variant={isMobile ? "h5" : "h4"} 
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 2,
              textAlign: isMobile ? "center" : "left", 
              color: '#037D40',
            }}
          >
            Booking Management
          </Typography>

          {/* --- Improved Search and Filter Controls --- */}
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2} 
            alignItems={isMobile ? "stretch" : "center"} 
            sx={{ mb: 3 }}
          >
            {/* Filter Type Toggle Buttons */}
            <ToggleButtonGroup
              value={filterType}
              exclusive 
              onChange={handleFilterTypeChange}
              aria-label="Filter type"
              sx={{
                height: "48px", 
                alignSelf: isMobile ? "center" : "auto", 
              }}
            >
              <ToggleButton value="student" aria-label="filter by student">
                Student
              </ToggleButton>
              <ToggleButton value="coach" aria-label="filter by coach">
                Coach
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Search Text Field */}
            <TextField
              fullWidth={isMobile} 
              variant="outlined"
              placeholder={`Search by ${filterType} name...`}
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#037D40' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {inputValue && (
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                        size="small"
                        sx={{ color: '#037D40' }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: isMobile ? "none" : 500, 
                "& .MuiOutlinedInput-root": {
                  height: "48px", 
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#037D40',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#037D40',
                  },
                },
              }}
            />
          </Stack>

          <Paper
            elevation={2} // Subtle elevation
            sx={{
              borderRadius: "12px", 
              overflow: "hidden", 
            }}
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 650 }} aria-label="appointments table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#037D40' }}>
                    {" "}
                    <TableCell sx={tableHeaderStyles}>Student Name</TableCell>
                    <TableCell sx={tableHeaderStyles}>Date</TableCell>
                    <TableCell sx={tableHeaderStyles}>Time</TableCell>
                    <TableCell sx={tableHeaderStyles}>Status</TableCell>
                    <TableCell sx={tableHeaderStyles}>
                      Appointment Details
                    </TableCell>
                    <TableCell sx={tableHeaderStyles}>Coach</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Show message if loading is finished but no appointments fetched (initial state) */}
                  {!loading && appointments.length === 0 && !error && (
                    <TableRow>
                      <TableCell colSpan={6} sx={tableCellCenterStyles}>
                        <Typography variant="body1" color="textSecondary">
                          No appointments have been booked yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Show message if filtering results in no matches */}
                  {!loading &&
                    appointments.length > 0 &&
                    filteredAppointments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={tableCellCenterStyles}>
                          <Typography variant="body1" color="textSecondary">
                            No appointments found matching &apos;{searchTerm}&apos;
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                  {/* Render paginated appointments */}
                  {paginatedAppointments.map((booking) => (
                    <TableRow
                      key={booking._id}
                      hover
                      sx={{ 
                        "&:last-child td, &:last-child th": { border: 0 },
                        '&:hover': {
                          backgroundColor: 'rgba(3, 125, 64, 0.05)',
                        }
                      }}
                    >
                      <TableCell sx={tableCellStyles}>
                        {booking.name || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {booking.selectedDate
                          ? new Date(booking.selectedDate).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {booking.selectedTime || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {booking.status || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {booking.appointmentDetails || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {booking.coachName || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Fill empty rows if needed to maintain consistent table height */}
                  {paginatedAppointments.length < rowsPerPage &&
                    filteredAppointments.length > 0 &&
                    Array.from({ length: rowsPerPage - paginatedAppointments.length }).map((_, index) => (
                      <TableRow key={`empty-${index}`} sx={{ height: 73 }}>
                        <TableCell colSpan={6} />
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Component */}
            <TablePagination
              rowsPerPageOptions={[]} // Hide rows per page selector since it's fixed at 10
              component="div"
              count={filteredAppointments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              sx={{
                borderTop: '1px solid rgba(224, 224, 224, 1)',
                '& .MuiTablePagination-displayedRows': {
                  color: '#037D40',
                  fontWeight: 500,
                },
                '& .MuiTablePagination-selectLabel': {
                  color: '#037D40',
                  fontWeight: 500,
                },
              }}
            />
          </Paper>

          {/* Show pagination info */}
          {filteredAppointments.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#037D40', fontWeight: 500 }}>
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
              </Typography>
            </Box>
          )}

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
              sx={{ width: "100%", fontSize: "1rem" }}
              elevation={6}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

// Common styles for table headers
const tableHeaderStyles = {
  fontSize: "1rem",
  fontWeight: 600,
  py: 1.5,
  px: 2,
  color: '#ffffff', 
  whiteSpace: "nowrap",
};

// Common styles for table cells
const tableCellStyles = {
  fontSize: "0.95rem",
  py: 1.5,
  px: 2,
  color: "text.secondary",
};

const tableCellCenterStyles = {
  textAlign: "center",
  py: 4,
  px: 2,
};
