// app/bmpadmin/dashboard/coach/page.js
"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  InputAdornment,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import Alert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import Pagination from "@mui/material/Pagination";
import { TablePagination } from "@mui/material";

// Custom theme with your color scheme
const customTheme = createTheme({
  palette: {
    primary: {
      main: "#037D40",
      light: "#4CAF50",
      dark: "#2E7D32",
      contrastText: "#ffffff",
    },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    success: {
      main: "#037D40",
      dark: "#2E7D32",
      light: "#4CAF50",
      contrastText: "#ffffff",
    },
    grey: {
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
    },
  },
});

// Returns the maximum number of students based on the plan
const getMaxStudents = (plan = "starter") => {
  // Default plan if none provided
  const safePlan = plan?.toLowerCase() || "starter";
  const plans = {
    starter: 25,
    growth: 50,
    pro: 100,
    enterprise: 10000, // Consider making this effectively infinite?
  };
  return plans[safePlan] ?? plans.starter; // Use nullish coalescing for safety
};

export default function CoachManagementPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCoach, setEditingCoach] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  // State for the filter type - default to 'name'
  const [filterType, setFilterType] = useState("name");
  // State for the text input field value (for debouncing Name/Email search)
  const [inputValue, setInputValue] = useState("");
  // State for the debounced search term used in filtering Name/Email
  const [searchTerm, setSearchTerm] = useState("");
  // State for the selected plan filter value (used when filterType is 'plan')
  const [selectedPlanFilter, setSelectedPlanFilter] = useState(""); // Default to empty (All Plans)

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // Update the debounced search term only when filtering by name or email
    if (filterType === "name" || filterType === "email") {
      const timeoutId = setTimeout(() => setSearchTerm(inputValue), 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear text search term immediately if switching away from name/email filter
      setSearchTerm("");
    }
  }, [filterType, inputValue]);

  // Fetch coaches data on component mount
  useEffect(() => {
    const fetchCoaches = async () => {
      setLoading(true);
      setError(""); // Clear previous errors
      try {
        const response = await fetch("/api/admin/coaches");
        if (!response.ok) {
          let errorMsg = "Failed to fetch coaches";
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {}
          throw new Error(errorMsg);
        }
        const data = await response.json();
        // Ensure maxStudents is calculated for each coach upon fetch if missing
        const coachesWithMaxStudents = data.map((coach) => ({
          ...coach,
          maxStudents: coach.maxStudents ?? getMaxStudents(coach.plan),
        }));
        setCoaches(coachesWithMaxStudents);
      } catch (err) {
        console.error("Fetch coaches error:", err);
        setError(err.message || "An error occurred while fetching coaches.");
        setSnackbar({
          open: true,
          message: err.message || "Failed to connect to the server.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCoaches();
  }, []); // Fetch only once on mount

  // Filter coaches based on the active filter type and its corresponding value
  const filteredCoaches = coaches.filter((coach) => {
    const searchLower = searchTerm.toLowerCase().trim();

    if (filterType === "name") {
      if (!searchLower) return true; // Show all if search term is empty
      const fullName = `${coach.firstName || ""} ${coach.lastName || ""}`
        .toLowerCase()
        .trim();
      return fullName.includes(searchLower);
    } else if (filterType === "email") {
      if (!searchLower) return true; // Show all if search term is empty
      return coach.email && coach.email.toLowerCase().includes(searchLower);
    } else if (filterType === "plan") {
      if (!selectedPlanFilter) return true; // Show all if "All Plans" is selected
      return (
        coach.plan &&
        coach.plan.toLowerCase() === selectedPlanFilter.toLowerCase()
      );
    }

    return true; // Default: show all if no specific filter is actively matched
  });

  // Handle deletion of a coach
  const handleDelete = async () => {
    if (!selectedCoachId) return;
    try {
      const response = await fetch(`/api/admin/coaches/${selectedCoachId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCoaches(coaches.filter((coach) => coach._id !== selectedCoachId));
        setSnackbar({
          open: true,
          message: "Coach deleted successfully",
          severity: "success",
        });
      } else {
        let errorMsg = "Failed to delete coach";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (parseError) {
          /* Ignore */
        }
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("Delete coach error:", err);
      setSnackbar({
        open: true,
        message: err.message || "An error occurred during deletion.",
        severity: "error",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setSelectedCoachId(null);
    }
  };

  // Handle updates to a coach's details
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingCoach) return;

    // Ensure maxStudents is correctly set based on the plan before saving
    const coachToUpdate = {
      ...editingCoach,
      maxStudents: getMaxStudents(editingCoach.plan),
    };

    try {
      const response = await fetch(`/api/admin/coaches/${editingCoach._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coachToUpdate),
      });
      const responseData = await response.json();
      if (response.ok) {
        setCoaches(
          coaches.map((coach) =>
            coach._id === responseData._id ? responseData : coach
          )
        );
        setSnackbar({
          open: true,
          message: "Coach updated successfully",
          severity: "success",
        });
        setEditingCoach(null); // Close dialog
      } else {
        throw new Error(responseData.message || "Failed to update coach");
      }
    } catch (err) {
      console.error("Update coach error:", err);
      setSnackbar({
        open: true,
        message: err.message || "An error occurred during update.",
        severity: "error",
      });
      // Keep dialog open on error
    }
  };

  // Handler for filter type change
  const handleFilterTypeChange = (event, newFilterType) => {
    if (newFilterType !== null) {
      setFilterType(newFilterType);
      setInputValue("");
      setSearchTerm("");
      setSelectedPlanFilter("");
      setPage(0);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate the current items to display
  const paginatedCoaches = filteredCoaches.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handler for clearing text search input
  const handleClearSearch = () => {
    setInputValue("");
    setSearchTerm("");
    setPage(0); // Reset to first page when clearing search
  };

  // Handler for plan filter dropdown change
  const handlePlanFilterChange = (event) => {
    setSelectedPlanFilter(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <ThemeProvider theme={customTheme}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
          sx={{ backgroundColor: "#ffffff" }}
        >
          <CircularProgress size={60} sx={{ color: "#037D40" }} />
        </Box>
      </ThemeProvider>
    );
  }

  if (!loading && error && coaches.length === 0) {
    return (
      <ThemeProvider theme={customTheme}>
        <Container
          maxWidth="lg"
          sx={{ mt: 2, mb: 4, backgroundColor: "#ffffff" }}
        >
          <Alert severity="error" sx={{ fontSize: "1.1rem" }}>
            {error}
          </Alert>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
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
            sx={headerStyles}
          >
            Coach Management
          </Typography>

          {/* --- Improved Search and Filter Controls --- */}
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "stretch" : "center"}
            sx={controlsStackStyles}
          >
            {/* Filter Type Toggle Buttons */}
            <ToggleButtonGroup
              value={filterType}
              exclusive
              onChange={handleFilterTypeChange}
              aria-label="Filter by"
              sx={toggleButtonGroupStyles(isMobile)}
            >
              <ToggleButton value="name" aria-label="filter by name">
                Name
              </ToggleButton>
              <ToggleButton value="email" aria-label="filter by email">
                Email
              </ToggleButton>
              <ToggleButton value="plan" aria-label="filter by plan">
                Plan
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Conditional Input: Text Field or Plan Select */}
            {filterType === "name" || filterType === "email" ? (
              <TextField
                fullWidth={isMobile}
                variant="outlined"
                placeholder={`Search by ${filterType}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
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
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={textFieldStyles(isMobile)}
              />
            ) : (
              // filterType === 'plan'
              <FormControl
                variant="outlined"
                sx={planSelectStyles(isMobile)}
                fullWidth={isMobile}
              >
                <InputLabel id="plan-filter-label">Select Plan</InputLabel>
                <Select
                  labelId="plan-filter-label"
                  value={selectedPlanFilter}
                  onChange={handlePlanFilterChange}
                  label="Select Plan"
                >
                  <MenuItem value="">
                    <em>All Plans</em>
                  </MenuItem>
                  <MenuItem value="starter">Starter</MenuItem>
                  <MenuItem value="growth">Growth</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="enterprise">Enterprise</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
          {/* --- End Search and Filter Controls --- */}

          <Paper elevation={2} sx={paperStyles}>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 800 }} aria-label="coaches table">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#037D40" }}>
                    <TableCell sx={tableHeaderStyles}>Name</TableCell>
                    <TableCell sx={tableHeaderStyles}>Email</TableCell>
                    <TableCell sx={tableHeaderStyles}>Contact</TableCell>
                    <TableCell sx={tableHeaderStyles}>Plan</TableCell>
                    <TableCell sx={tableHeaderStyles}>Billing Cycle</TableCell>
                    <TableCell sx={tableHeaderStyles} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Messages for no data or no results */}
                  {!loading && coaches.length === 0 && !error && (
                    <TableRow
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": {
                          backgroundColor: "rgba(3, 125, 64, 0.05)",
                        },
                      }}
                    >
                      <TableCell colSpan={6} sx={tableCellCenterStyles}>
                        <Typography variant="body1" color="textSecondary">
                          No coaches found in the system.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    coaches.length > 0 &&
                    filteredCoaches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={tableCellCenterStyles}>
                          <Typography variant="body1" color="textSecondary">
                            No coaches found matching criteria
                            {filterType === "plan" && selectedPlanFilter
                              ? ` (Plan: ${selectedPlanFilter})`
                              : ""}
                            {(filterType === "name" ||
                              filterType === "email") &&
                            searchTerm
                              ? ` ('${searchTerm}')`
                              : ""}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                  {/* Render paginated coaches */}
                  {paginatedCoaches.map((coach) => (
                    <TableRow
                      key={coach._id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": {
                          backgroundColor: "rgba(3, 125, 64, 0.05)",
                        },
                      }}
                    >
                      <TableCell sx={tableCellStyles}>
                        {`${coach.firstName || ""} ${
                          coach.lastName || ""
                        }`.trim() || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {coach.email || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyles}>
                        {coach.contact || "N/A"}
                      </TableCell>
                      <TableCell
                        sx={{ ...tableCellStyles, textTransform: "capitalize" }}
                      >
                        {coach.plan || "N/A"}
                      </TableCell>
                      <TableCell
                        sx={{ ...tableCellStyles, textTransform: "capitalize" }}
                      >
                        {coach.billingCycle || "N/A"}
                      </TableCell>
                      <TableCell
                        sx={{ ...tableCellStyles, py: 1 }}
                        align="center"
                      >
                        <Stack
                          direction={isMobile ? "column" : "row"}
                          spacing={1}
                          justifyContent="center"
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => setEditingCoach({ ...coach })} // Pass a copy
                            sx={editButtonStyle}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => {
                              setSelectedCoachId(coach._id);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={deleteButtonStyle}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Fill empty rows if needed to maintain consistent table height */}
                  {paginatedCoaches.length < rowsPerPage &&
                    filteredCoaches.length > 0 &&
                    Array.from({
                      length: rowsPerPage - paginatedCoaches.length,
                    }).map((_, index) => (
                      <TableRow key={`empty-${index}`} sx={{ height: 73 }}>
                        <TableCell colSpan={5} />
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination controls */}
            <TablePagination
              rowsPerPageOptions={[]}
              component="div"
              count={filteredCoaches.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              // onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: "1px solid rgba(224, 224, 224, 1)",
                "& .MuiTablePagination-displayedRows": {
                  color: "#037D40",
                  fontWeight: 500,
                },
                "& .MuiTablePagination-actions button": {
                  color: "#037D40",
                },
                "& .MuiTablePagination-selectLabel": {
                  color: "#037D40",
                  fontWeight: 500,
                },
              }}
            />
          </Paper>

          {/* Show pagination info */}
          {filteredCoaches.length > 0 && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{ color: "#037D40", fontWeight: 500 }}
              >
                Showing {page * rowsPerPage + 1} to{" "}
                {Math.min((page + 1) * rowsPerPage, filteredCoaches.length)} of{" "}
                {filteredCoaches.length} coaches
              </Typography>
            </Box>
          )}

          {/* --- Dialogs --- */}
          {/* Edit Coach Dialog */}
          <Dialog
            open={Boolean(editingCoach)}
            onClose={() => setEditingCoach(null)}
            maxWidth="sm"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
              sx: { backgroundColor: "#ffffff" },
            }}
          >
            <DialogTitle sx={dialogTitleStyles}>Edit Coach Details</DialogTitle>
            <form onSubmit={handleUpdate}>
              <DialogContent sx={dialogContentStyles}>
                <TextField
                  margin="dense"
                  label="First Name"
                  fullWidth
                  required
                  value={editingCoach?.firstName || ""}
                  onChange={(e) =>
                    setEditingCoach({
                      ...editingCoach,
                      firstName: e.target.value,
                    })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />
                <TextField
                  margin="dense"
                  label="Last Name"
                  fullWidth
                  value={editingCoach?.lastName || ""}
                  onChange={(e) =>
                    setEditingCoach({
                      ...editingCoach,
                      lastName: e.target.value,
                    })
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
                  value={editingCoach?.email || ""}
                  onChange={(e) =>
                    setEditingCoach({ ...editingCoach, email: e.target.value })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />
                <TextField
                  margin="dense"
                  label="Contact"
                  fullWidth
                  required
                  value={editingCoach?.contact || ""}
                  onChange={(e) =>
                    setEditingCoach({
                      ...editingCoach,
                      contact: e.target.value,
                    })
                  }
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                />

                {/* Use FormControl/Select for Plan */}
                <FormControl
                  fullWidth
                  margin="dense"
                  sx={dialogTextFieldStyles}
                >
                  <InputLabel
                    id="edit-coach-plan-label"
                    sx={dialogInputLabelStyles.style}
                  >
                    Plan
                  </InputLabel>
                  <Select
                    labelId="edit-coach-plan-label"
                    label="Plan"
                    value={editingCoach?.plan || "starter"}
                    onChange={(e) =>
                      setEditingCoach({
                        ...editingCoach,
                        plan: e.target.value,
                        // maxStudents is derived, no need to set directly here, will be calc'd on save
                      })
                    }
                    inputProps={{ sx: { fontSize: "1rem" } }}
                  >
                    <MenuItem value="starter">Starter</MenuItem>
                    <MenuItem value="growth">Growth</MenuItem>
                    <MenuItem value="pro">Pro</MenuItem>
                    <MenuItem value="enterprise">Enterprise</MenuItem>
                  </Select>
                </FormControl>

                {/* Use FormControl/Select for Billing Cycle */}
                <FormControl
                  fullWidth
                  margin="dense"
                  sx={dialogTextFieldStyles}
                >
                  <InputLabel
                    id="edit-coach-billing-label"
                    sx={dialogInputLabelStyles.style}
                  >
                    Billing Cycle
                  </InputLabel>
                  <Select
                    labelId="edit-coach-billing-label"
                    label="Billing Cycle"
                    value={editingCoach?.billingCycle || "monthly"}
                    onChange={(e) =>
                      setEditingCoach({
                        ...editingCoach,
                        billingCycle: e.target.value,
                      })
                    }
                    inputProps={{ sx: { fontSize: "1rem" } }}
                  >
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>

                {/* Display Max Students (derived) - Disabled */}
                <TextField
                  margin="dense"
                  label="Max Students"
                  fullWidth
                  disabled
                  value={getMaxStudents(editingCoach?.plan)}
                  sx={dialogTextFieldStyles}
                  InputLabelProps={dialogInputLabelStyles}
                  InputProps={{ sx: { fontSize: "1rem" } }}
                />
              </DialogContent>
              <DialogActions sx={dialogActionsStyles}>
                <Button
                  onClick={() => setEditingCoach(null)}
                  sx={dialogCancelButtonStyle}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={dialogSaveButtonStyle}
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
            PaperProps={{
              sx: { backgroundColor: "#ffffff" },
            }}
          >
            <DialogTitle sx={dialogTitleStyles}>Confirm Delete</DialogTitle>
            <DialogContent sx={dialogContentStyles}>
              <Typography sx={{ fontSize: "1.05rem" }}>
                Are you sure you want to delete this coach? This action cannot
                be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={dialogActionsStyles}>
              <Button
                onClick={() => setDeleteConfirmOpen(false)}
                sx={dialogCancelButtonStyle}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
                variant="contained"
                sx={dialogDeleteButtonStyle}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              sx={{
                width: "100%",
                fontSize: "1rem",
                backgroundColor:
                  snackbar.severity === "success" ? "#037D40" : undefined,
                color: snackbar.severity === "success" ? "#ffffff" : undefined,
              }}
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

// --- Reusable Style Objects ---

const containerStyles = {
  px: { xs: 2, sm: 3, md: 4 },
  py: 4,
  mt: { xs: 4, sm: 6, md: 8 },
};

const headerStyles = {
  fontWeight: 600,
  mb: 3,
  textAlign: { xs: "center", sm: "left" },
  color: "#037D40",
};

const controlsStackStyles = {
  mb: 4,
};

const toggleButtonGroupStyles = (isMobile) => ({
  height: "48px",
  alignSelf: isMobile ? "center" : "auto",
  "& .MuiToggleButton-root": {
    border: "1px solid #037D40",
    color: "#037D40",
    "&.Mui-selected": {
      backgroundColor: "#037D40",
      color: "#ffffff",
      "&:hover": {
        backgroundColor: "#2E7D32",
      },
    },
    "&:hover": {
      backgroundColor: "rgba(3, 125, 64, 0.1)",
    },
  },
});

const textFieldStyles = (isMobile) => ({
  maxWidth: isMobile ? "none" : 500,
  "& .MuiOutlinedInput-root": {
    height: "48px",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#037D40",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#037D40",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#037D40",
  },
});

const planSelectStyles = (isMobile) => ({
  minWidth: 150,
  maxWidth: isMobile ? "none" : 300,
  "& .MuiOutlinedInput-root": {
    height: "48px",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#037D40",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#037D40",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#037D40",
  },
});

const paperStyles = {
  borderRadius: "12px",
  overflow: "hidden",
  backgroundColor: "#ffffff",
  border: "1px solid #e0e0e0",
};

const tableHeaderStyles = {
  fontSize: "0.9rem",
  fontWeight: 600,
  py: 1.5,
  px: 2,
  color: "#ffffff",
  whiteSpace: "nowrap",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  backgroundColor: "#037D40",
};

const tableCellStyles = {
  fontSize: "0.9rem",
  py: 1.5,
  px: 2,
  color: "text.secondary",
};

const tableCellCenterStyles = {
  textAlign: "center",
  py: 4,
  px: 2,
};

const editButtonStyle = {
  fontWeight: 500,
  backgroundColor: "#037D40",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#2E7D32",
  },
};

const deleteButtonStyle = {
  fontWeight: 500,
};

const dialogTitleStyles = {
  fontSize: "1.3rem",
  fontWeight: 600,
  pb: 1,
  pt: { xs: 2, sm: 2.5 },
  px: { xs: 2, sm: 3 },
  borderBottom: "1px solid #e0e0e0",
  color: "#037D40",
};

const dialogContentStyles = {
  pt: "20px !important",
  px: { xs: 2, sm: 3 },
  pb: { xs: 1, sm: 2 },
};

const dialogActionsStyles = {
  px: { xs: 2, sm: 3 },
  py: { xs: 1.5, sm: 2 },
  borderTop: "1px solid #e0e0e0",
};

const dialogTextFieldStyles = {
  mb: 2.5,
  "& .MuiInputBase-input": { fontSize: "1rem" },
  "& .MuiOutlinedInput-root": {
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "#037D40",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "#037D40",
    },
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#037D40",
  },
};

const dialogInputLabelStyles = {
  style: { fontSize: "1rem" },
};

const dialogBaseButtonStyle = {
  fontSize: "0.9rem",
  px: 2.5,
  py: 0.75,
  textTransform: "none",
};

const dialogCancelButtonStyle = {
  ...dialogBaseButtonStyle,
  color: "#666666",
  border: "1px solid #e0e0e0",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
};

const dialogSaveButtonStyle = {
  ...dialogBaseButtonStyle,
  backgroundColor: "#037D40",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#2E7D32",
  },
};

const dialogDeleteButtonStyle = {
  ...dialogBaseButtonStyle,
};
