// app/bmpadmin/dashboard/student/page.js
"use client";
import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Container, useTheme, useMediaQuery, InputAdornment, Stack, ToggleButton, ToggleButtonGroup, IconButton, TablePagination, createTheme, ThemeProvider } from "@mui/material";
import Alert from "@mui/material/Alert";
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
    success: {
      main: '#037D40',
      dark: '#025D30',
      contrastText: '#ffffff',
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
    MuiButton: {
      styleOverrides: {
        containedSuccess: {
          backgroundColor: '#037D40',
          '&:hover': {
            backgroundColor: '#025D30',
          },
        },
      },
    },
  },
});

export default function StudentManagementPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Pagination states - fixed at 10 rows per page
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10); // Fixed at 10 rows per page

  // State for the actual search term used in filtering
  const [searchTerm, setSearchTerm] = useState("");
  // State for the input field value (for debouncing)
  const [inputValue, setInputValue] = useState("");
  // State for the filter type - default to 'name'
  const [filterType, setFilterType] = useState("name");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchTerm(inputValue);
      setPage(0); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, setPage]);

  // Fetch students data on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(""); // Clear previous errors
      try {
        const response = await fetch("/api/admin/students");
        if (!response.ok) {
          // Try to parse error message from response body
          let errorMsg = "Failed to fetch students";
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            // Ignore if response body is not JSON or empty
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error("Fetch students error:", err);
        setError(err.message || "An error occurred while fetching students.");
        // Show error in snackbar as well
        setSnackbar({
          open: true,
          message: err.message || "Failed to connect to the server.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter students based on the debounced search term and filter type
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase().trim(); // Trim whitespace
    if (!searchLower) return true; // Show all if search term is empty

    if (filterType === "name") {
      // Add checks for null/undefined properties for safety
      return student.name && student.name.toLowerCase().includes(searchLower);
    } else if (filterType === "email") {
      return student.email && student.email.toLowerCase().includes(searchLower);
    }
    return false;
  });

  // Get paginated data
  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle updates to a student's details
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStudent) return; // Should not happen, but good practice

    try {
      const response = await fetch(
        `/api/admin/students/${editingStudent._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingStudent),
        }
      );

      const responseData = await response.json(); // Always try to parse JSON

      if (response.ok) {
        setStudents(
          students.map((student) =>
            student._id === responseData._id ? responseData : student
          )
        );
        setSnackbar({
          open: true,
          message: "Student updated successfully",
          severity: "success",
        });
        setEditingStudent(null); // Close dialog on success
      } else {
        // Use message from response data if available
        throw new Error(responseData.message || "Failed to update student");
      }
    } catch (err) {
      console.error("Update student error:", err);
      setSnackbar({
        open: true,
        message: err.message || "An error occurred during update.",
        severity: "error",
      });
      // Keep the dialog open on error so user can see/correct data
    }
  };

  // Handle deletion of a student
  const handleDelete = async () => {
    if (!selectedStudentId) return;

    try {
      const response = await fetch(`/api/admin/students/${selectedStudentId}`, {
        method: "DELETE",
      });

      // Check status first, as DELETE might not return a body on success
      if (response.ok) {
        setStudents(
          students.filter((student) => student._id !== selectedStudentId)
        );
        setSnackbar({
          open: true,
          message: "Student deleted successfully",
          severity: "success",
        });
      } else {
        let errorMsg = "Failed to delete student";
        try {
          // Attempt to get error message from response body
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (parseError) {
          // Ignore if no JSON body
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Delete student error:", err);
      setSnackbar({
        open: true,
        message: err.message || "An error occurred during deletion.",
        severity: "error",
      });
    } finally {
      setDeleteConfirmOpen(false); // Close confirmation dialog
      setSelectedStudentId(null); // Reset selected ID
    }
  };

  // Handler for filter type change
  const handleFilterTypeChange = (event, newFilterType) => {
    // Prevent deselecting all buttons in exclusive mode
    if (newFilterType !== null) {
      setFilterType(newFilterType);
      setPage(0); // Reset to first page when filter changes
      // Optional: Clear search when changing filter type
      // setInputValue("");
      // setSearchTerm("");
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handler for clearing search input
  const handleClearSearch = () => {
    setInputValue("");
    setSearchTerm(""); // Clear the debounced term immediately as well
    setPage(0); // Reset to first page when clearing search
  };

  // --- Render Logic ---

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

  // Render error state *after* loading is false
  if (!loading && error && students.length === 0) {
    // Show full page error only if loading finished and no data was ever loaded
    return (
      <ThemeProvider theme={customTheme}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, backgroundColor: '#ffffff', minHeight: '100vh', pt: 4 }}>
          <Alert severity="error" sx={{ fontSize: "1.1rem" }}>
            {error}
          </Alert>
          {/* Optionally add a retry button here */}
        </Container>
      </ThemeProvider>
    );
  }

  // --- Main Page Content ---
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
              mb: 3, // Spacing below title
              textAlign: isMobile ? "center" : "left",
              color: '#037D40',
            }}
          >
            Student Management
          </Typography>

          {/* --- Improved Search and Filter Controls --- */}
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2} // Consistent spacing
            alignItems={isMobile ? "stretch" : "center"} // Align center vertically on desktop
            sx={{
              mb: 4, // Spacing below controls, before table
            }}
          >
            {/* Filter Type Toggle Buttons */}
            <ToggleButtonGroup
              value={filterType}
              exclusive // Only one button active
              onChange={handleFilterTypeChange}
              aria-label="Filter by"
              sx={{
                height: "48px", // Match TextField height
                alignSelf: isMobile ? "center" : "auto", // Center toggle group on mobile
              }}
            >
              <ToggleButton value="name" aria-label="filter by name">
                Name
              </ToggleButton>
              <ToggleButton value="email" aria-label="filter by email">
                Email
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Search Text Field */}
            <TextField
              fullWidth={isMobile} // Full width on mobile
              variant="outlined"
              placeholder={`Search by ${filterType}...`} // Dynamic placeholder
              value={inputValue} // Controlled by inputValue state
              onChange={(e) => setInputValue(e.target.value)} // Update inputValue directly
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#037D40' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {/* Show clear button only if there is text */}
                    {inputValue && (
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                        size="small" // Smaller icon button
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
            elevation={2} // Softer shadow
            sx={{
              borderRadius: "12px", 
              overflow: "hidden", 
            }}
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 750 }} aria-label="students table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#037D40' }}>
                    <TableCell sx={tableHeaderStyles}>Name</TableCell>
                    <TableCell sx={tableHeaderStyles}>Email</TableCell>
                    <TableCell sx={tableHeaderStyles}>Phone</TableCell>
                    <TableCell sx={tableHeaderStyles}>Address</TableCell>
                    <TableCell sx={tableHeaderStyles} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Message when no students exist at all (after loading) */}
                  {!loading && students.length === 0 && !error && (
                    <TableRow>
                      <TableCell colSpan={5} sx={tableCellCenterStyles}>
                        <Typography variant="body1" color="textSecondary">
                          No students found in the system.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Message when filter returns no results */}
                  {!loading &&
                    students.length > 0 &&
                    filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} sx={tableCellCenterStyles}>
                          <Typography variant="body1" color="textSecondary">
                            No students found matching &apos;{searchTerm}&apos;
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                  {/* Render paginated students */}
                  {paginatedStudents.map((student) => (
                    <TableRow
                      key={student._id}
                      hover
                      sx={{ 
                        "&:last-child td, &:last-child th": { border: 0 },
                        '&:hover': {
                          backgroundColor: 'rgba(3, 125, 64, 0.05)',
                        }
                      }}
                    >
                      <TableCell sx={tableCellStyles}>
                        {student.name || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {student.email || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {student.phone || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {student.address || "N/A"}
                      </TableCell>
                      <TableCell sx={{ ...tableCellStyles, py: 1 }} align="center">
                        <Stack
                          direction={isMobile ? "column" : "row"}
                          spacing={1}
                          justifyContent="center"
                        >
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => setEditingStudent({ ...student })}
                            sx={{
                              fontWeight: 500,
                              backgroundColor: '#037D40',
                              "&:hover": {
                                backgroundColor: '#025D30',
                              },
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => {
                              setSelectedStudentId(student._id);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{
                              fontWeight: 500,
                            }}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Fill empty rows if needed to maintain consistent table height */}
                  {paginatedStudents.length < rowsPerPage &&
                    filteredStudents.length > 0 &&
                    Array.from({ length: rowsPerPage - paginatedStudents.length }).map((_, index) => (
                      <TableRow key={`empty-${index}`} sx={{ height: 73 }}>
                        <TableCell colSpan={5} />
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Component */}
            <TablePagination
              rowsPerPageOptions={[]} // Hide rows per page selector since it's fixed at 10
              component="div"
              count={filteredStudents.length}
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
          {filteredStudents.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#037D40', fontWeight: 500 }}>
                Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredStudents.length)} of {filteredStudents.length} students
              </Typography>
            </Box>
          )}

          {/* --- Dialogs --- */}

          {/* Edit Student Dialog */}
          <Dialog
            open={Boolean(editingStudent)}
            onClose={() => setEditingStudent(null)}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile} // Fullscreen on mobile
          >
            <DialogTitle sx={dialogTitleStyles}>Edit Student Details</DialogTitle>
            <form onSubmit={handleUpdate}>
              <DialogContent sx={dialogContentStyles}>
                {/* Use consistent spacing and styling for fields */}
                <TextField
                  margin="dense" // Use dense margin for dialogs
                  label="Name"
                  fullWidth
                  required
                  value={editingStudent?.name || ""}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, name: e.target.value })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />
                <TextField
                  margin="dense"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={editingStudent?.email || ""}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, email: e.target.value })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />
                <TextField
                  margin="dense"
                  label="Phone"
                  fullWidth
                  required // Assuming phone is required based on original code
                  value={editingStudent?.phone || ""}
                  onChange={(e) =>
                    setEditingStudent({ ...editingStudent, phone: e.target.value })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />
                <TextField
                  margin="dense"
                  label="Address"
                  fullWidth
                  required // Assuming address is required
                  value={editingStudent?.address || ""}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      address: e.target.value,
                    })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />
              </DialogContent>
              <DialogActions sx={dialogActionsStyles}>
                <Button
                  onClick={() => setEditingStudent(null)}
                  sx={dialogButtonStyle}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    ...dialogButtonStyle,
                    backgroundColor: '#037D40',
                    "&:hover": { backgroundColor: '#025D30' },
                    color: '#ffffff',
                  }}
                >
                  Save Changes
                </Button>
              </DialogActions>
            </form>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle sx={dialogTitleStyles}>Confirm Delete</DialogTitle>
            <DialogContent sx={dialogContentStyles}>
              <Typography sx={{ fontSize: "1.05rem" }}>
                Are you sure you want to delete this student? This action cannot be
                undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={dialogActionsStyles}>
              <Button
                onClick={() => setDeleteConfirmOpen(false)}
                sx={dialogButtonStyle}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                color="error" // Use theme error color
                variant="contained"
                sx={dialogButtonStyle}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* --- Snackbar --- */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            {/* Ensure Alert is imported from @mui/material */}
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
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

// --- Reusable Style Objects (Updated with theme colors) ---

const tableHeaderStyles = {
  fontSize: "1rem",
  fontWeight: 600,
  py: 1.5,
  px: 2,
  color: '#ffffff', 
  whiteSpace: "nowrap", 
  textTransform: "uppercase", 
  letterSpacing: "0.5px",
};

const tableCellStyles = {
  fontSize: "0.95rem", 
  py: 1.5,
  px: 2,
  color: "text.secondary",
};

const tableCellCenterStyles = {
  textAlign: "center",
  py: 4, 
};

const dialogTitleStyles = {
  fontSize: "1.3rem",
  fontWeight: 600,
  pb: 1, 
  pt: { xs: 2, sm: 2.5 }, 
  px: { xs: 2, sm: 3 }, 
  borderBottom: `1px solid ${"#e0e0e0"}`, 
  color: '#037D40',
};

const dialogContentStyles = {
  pt: "20px !important",
  px: { xs: 2, sm: 3 },
  pb: { xs: 1, sm: 2 },
};

const dialogActionsStyles = {
  px: { xs: 2, sm: 3 },
  py: { xs: 1.5, sm: 2 },
  borderTop: `1px solid ${"#e0e0e0"}`, 
};

const dialogTextFieldStyles = {
  mb: 2, 
  "& .MuiInputBase-input": { fontSize: "1rem" },
  "& .MuiOutlinedInput-root": {
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#037D40',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#037D40',
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: '#037D40',
  },
};

const dialogInputLabelStyles = {
  style: { fontSize: "1rem" }, 
};

const dialogButtonStyle = {
  fontSize: "0.9rem",
  px: 2.5,
  py: 0.75,
  textTransform: "none",
};
