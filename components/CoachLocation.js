import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Chip,
  InputAdornment,
} from "@mui/material";
import { LocationOn, Add, Save, FmdGood } from "@mui/icons-material";

const CoachLocation = () => {
  const { data: session } = useSession();
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchLocations = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/locations?coachId=${session.user.id}`,
      );

      const fetchedLocations = response.data?.locations || [];

      setLocations(
        Array.isArray(fetchedLocations)
          ? fetchedLocations.map((loc) => (typeof loc === "string" ? loc : ""))
          : [],
      );
    } catch (error) {
      console.error("Error fetching locations:", error);
      showSnackbar("Failed to load locations", "error");
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const handleAddLocation = async () => {
    if (!newLocation.trim()) {
      showSnackbar("Please enter a location", "error");
      return;
    }

    if (locations.length >= 5) {
      showSnackbar("Maximum of 5 locations allowed", "warning");
      return;
    }

    setLocations((prev) => [...prev, newLocation.trim()]);
    setNewLocation("");
  };

  const handleSaveLocations = async () => {
    if (!session?.user?.id) return;

    try {
      setIsSaving(true);
      const response = await axios.post("/api/locations", {
        coachId: session.user.id,
        locations: locations.map((loc) => loc.trim()),
      });

      if (response.data.success) {
        showSnackbar("Locations saved successfully!", "success");
      } else {
        showSnackbar(
          response.data.error || "Failed to save locations",
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving locations:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to save locations";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLocation = async (index) => {
    try {
      setIsLoading(true);
      await axios.delete(
        `/api/locations?coachId=${session.user.id}&location=${encodeURIComponent(locations[index])}`,
      );

      setLocations((prev) => prev.filter((_, i) => i !== index));
      showSnackbar("Location removed successfully", "success");
    } catch (error) {
      console.error("Error removing location:", error);
      showSnackbar("Failed to remove location", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return (
    <>
      {/* ── Section header — matches the pattern used across all cards ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#037D40",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          <LocationOn />
          Location Management
        </Typography>

        {/* Slot counter pill */}
        <Chip
          label={isLoading ? "…/5" : `${locations.length} / 5`}
          size="small"
          sx={{
            bgcolor: locations.length >= 5 ? "#FFF3E0" : "#E6F2EC",
            color: locations.length >= 5 ? "#E65100" : "#037D40",
            fontWeight: 700,
            fontSize: "0.75rem",
            border: "1px solid",
            borderColor: locations.length >= 5 ? "#FFCC80" : "#A5D6A7",
          }}
        />
      </Box>

      <Typography
        variant="body2"
        sx={{ color: "#6B7280", mb: 2.5, fontFamily: "Kanit, sans-serif" }}
      >
        Add up to 5 locations where you provide coaching sessions.
      </Typography>

      {/* ── Input row ── */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          alignItems: { xs: "stretch", sm: "center" },
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          size="small"
          label="New location"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddLocation();
            }
          }}
          placeholder="e.g., 123 Main St, Sydney"
          disabled={isLoading || locations.length >= 5}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FmdGood sx={{ color: "#037D40", fontSize: "1.1rem" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              backgroundColor: "white",
            },
          }}
        />

        <Button
          startIcon={<Add />}
          onClick={handleAddLocation}
          disabled={!newLocation.trim() || isLoading || locations.length >= 5}
          sx={{
            whiteSpace: "nowrap",
            flexShrink: 0,
            height: "40px",
            width: { xs: "100%", sm: "auto" },
            px: 2.5,
            borderRadius: "8px",
            backgroundColor: "#037D40",
            color: "#FFFFFF",
            fontFamily: "Kanit, sans-serif",
            textTransform: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#026935", color: "#FFFFFF" },
            "&.Mui-disabled": {
              backgroundColor: "#037D40",
              opacity: 0.5,
              color: "#FFFFFF",
            },
          }}
        >
          Add Location
        </Button>
      </Box>

      {/* ── Location chips ── */}
      {isLoading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
          <CircularProgress size={18} sx={{ color: "#037D40" }} />
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            Loading locations…
          </Typography>
        </Box>
      ) : locations.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 3,
            bgcolor: "#F9FAFB",
            borderRadius: "8px",
            border: "1px dashed #D1D5DB",
          }}
        >
          <LocationOn sx={{ color: "#D1D5DB", fontSize: "2rem", mb: 0.5 }} />
          <Typography
            variant="body2"
            sx={{ color: "#9CA3AF", fontFamily: "Kanit, sans-serif" }}
          >
            No locations added yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {locations.map((location, index) => (
            <Chip
              key={index}
              icon={
                <FmdGood
                  sx={{ color: "#037D40 !important", fontSize: "1rem" }}
                />
              }
              label={location}
              onDelete={() => handleRemoveLocation(index)}
              sx={{
                bgcolor: "#E6F2EC",
                color: "#1a1a1a",
                borderRadius: "8px",
                height: "auto",
                py: 0.5,
                fontFamily: "Kanit, sans-serif",
                fontSize: "0.875rem",
                "& .MuiChip-label": { px: "8px" },
                "& .MuiChip-deleteIcon": {
                  color: "#037D40",
                  "&:hover": { color: "#c0392b" },
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* ── Save button ── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "stretch", sm: "flex-end" },
          mt: 3,
        }}
      >
        <Button
          startIcon={
            isSaving ? <CircularProgress size={14} color="inherit" /> : <Save />
          }
          onClick={handleSaveLocations}
          disabled={isSaving || locations.length === 0}
          sx={{
            height: "40px",
            width: { xs: "100%", sm: "auto" },
            px: 3,
            borderRadius: "8px",
            backgroundColor: "#037D40",
            color: "#FFFFFF",
            fontFamily: "Kanit, sans-serif",
            textTransform: "none",
            fontSize: "0.9rem",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#026935", color: "#FFFFFF" },
            "&.Mui-disabled": {
              backgroundColor: "#037D40",
              opacity: 0.5,
              color: "#FFFFFF",
            },
          }}
        >
          {isSaving ? "Saving…" : "Save Locations"}
        </Button>
      </Box>

      {/* ── Toast notifications ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CoachLocation;
