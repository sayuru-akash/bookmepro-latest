"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

// Day.js for date formatting
import dayjs from "dayjs";

// MUI Imports
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
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
  Stack,
} from "@mui/material";
import { Delete, Event, Schedule, Group, Person } from "@mui/icons-material";

// Toast Notifications
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// A styled Card component for consistent UI.
const StyledCard = ({ children }) => (
  <Card
    sx={{
      mb: 3,
      borderRadius: 3,
      backgroundColor: "#FFFFFF",
      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      border: "1px solid rgba(3, 125, 64, 0.1)",
      transition: "all 0.3s ease",
      "&:hover": { 
        transform: "translateY(-4px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)"
      },
    }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>{children}</CardContent>
  </Card>
);

// Helper function to parse MongoDB's extended JSON date format if present.
const parseMongoDate = (dateObj) => {
  if (dateObj?.$date?.$numberLong) {
    return new Date(parseInt(dateObj.$date.$numberLong));
  }
  return new Date(dateObj);
};

const AvailabilityManager = () => {
  const { data: session } = useSession();
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const selectedBgColor = "#D1E8D5";
  const selectedTextColor = "#037D40";

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/available_dates?coachId=${session.user.id}`
        );
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filteredAndSortedDates = response.data
          .map((d) => ({
            ...d,
            date: parseMongoDate(d.date), // Ensure date is a JS Date object
          }))
          .filter((d) => d.date >= today) // Show only upcoming dates
          .sort((a, b) => a.date - b.date); // Sort by date ascending

        setAvailableDates(filteredAndSortedDates);

      } catch (error) {
        console.error("Error fetching availability:", error);
        toast.error("Failed to load your availability.", { toastId: "fetch-avail-error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [session]);

  const removeAvailableDate = async (dateId) => {
    const originalDates = [...availableDates];
    setAvailableDates(prevDates => prevDates.filter((item) => item._id !== dateId));

    try {
      await axios.delete(`/api/available_dates?id=${dateId}`);
      toast.success("Date removed successfully.", { toastId: "date-remove-success" });
    } catch (error) {
      // Revert if API call fails
      setAvailableDates(originalDates);
      console.error("Error removing date:", error);
      toast.error("Failed to remove date.", { toastId: "date-remove-error" });
    }
  };

  const removeTimeSlotFromDate = async (dateId, timeSlotIndex) => {
    const originalDates = JSON.parse(JSON.stringify(availableDates)); // Deep copy
    const targetDate = availableDates.find((d) => d._id === dateId);
    if (!targetDate) return;

    const updatedTimeSlots = targetDate.timeSlots.filter((_, i) => i !== timeSlotIndex);

    // update UI
    setAvailableDates(prevDates =>
      prevDates.map(d =>
        d._id === dateId ? { ...d, timeSlots: updatedTimeSlots } : d
      )
    );

    try {
      await axios.put(`/api/available_dates?id=${dateId}`, {
        timeSlots: updatedTimeSlots,
      });
      toast.success("Time slot removed successfully.", { toastId: "time-slot-success" });
    } catch (error) {
      // Revert if API call fails
      setAvailableDates(originalDates);
      console.error("Error updating time slots:", error);
      toast.error("Failed to remove time slot.", { toastId: "time-slot-error" });
    }
  };

  // Mobile card view for better responsiveness
  const MobileAvailabilityCard = ({ date }) => (
    <Paper 
      elevation={0}
      sx={{ 
        mb: 2, 
        p: 2, 
        backgroundColor: "#FAFAFA",
        border: "1px solid #E0E0E0",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "#F5F5F5",
          borderColor: selectedTextColor,
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: "black",
            fontFamily: "Kanit, sans-serif",
          }}
        >
          {dayjs(date.date).format("ddd, MMM D")}
        </Typography>
        <IconButton
          onClick={() => removeAvailableDate(date._id)}
          color="error"
          size="small"
          sx={{ mt: -1 }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
      
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {date.timeSlots.map((slot, index) => (
          <Chip
            key={index}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule fontSize="small" />
                <span>{slot.time}</span>
                {slot.multipleBookings ? <Group fontSize="small" /> : <Person fontSize="small" />}
              </Box>
            }
            onDelete={() => removeTimeSlotFromDate(date._id, index)}
            sx={{
              backgroundColor: selectedBgColor,
              color: "black",
              fontFamily: "Kanit, sans-serif",
              fontWeight: 500,
              '& .MuiChip-deleteIcon': {
                color: selectedTextColor,
                '&:hover': {
                  color: '#025530'
                }
              }
            }}
          />
        ))}
      </Box>
    </Paper>
  );

  return (
    <StyledCard>
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 1.5, 
        mb: 3,
        pb: 2,
        borderBottom: `2px solid ${selectedBgColor}`,
      }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 2, 
          backgroundColor: selectedBgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Event sx={{ color: selectedTextColor, fontSize: 28 }} />
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600, 
            color: selectedTextColor,
            fontFamily: "Kanit, sans-serif",
          }}
        >
          Upcoming Availability
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          <CircularProgress sx={{ color: selectedTextColor, mb: 2 }} size={40} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: "text.secondary",
              fontFamily: "Kanit, sans-serif",
            }}
          >
            Loading your availability...
          </Typography>
        </Box>
      ) : availableDates.length > 0 ? (
        <>
          {isMobile ? (
            <Box>
              {availableDates.map((date) => (
                <MobileAvailabilityCard key={date._id} date={date} />
              ))}
            </Box>
          ) : (
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{ 
                borderRadius: 2,
                border: "1px solid #E0E0E0",
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: selectedBgColor }}>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: "black",
                      fontFamily: "Kanit, sans-serif",
                      fontSize: 16,
                      py: 2
                    }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 700, 
                      color: "black",
                      fontFamily: "Kanit, sans-serif",
                      fontSize: 16,
                      py: 2
                    }}>
                      Time Slots
                    </TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        fontWeight: 700, 
                        color: "black",
                        fontFamily: "Kanit, sans-serif",
                        fontSize: 16,
                        py: 2
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableDates.map((d, rowIndex) => (
                    <TableRow 
                      key={d._id} 
                      hover
                      sx={{
                        backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                        '&:hover': {
                          backgroundColor: "#F0F8F2 !important"
                        },
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{
                          fontFamily: "Kanit, sans-serif",
                          fontWeight: 600,
                          color: "black",
                          fontSize: 15,
                          py: 2.5
                        }}
                      >
                        {dayjs(d.date).format("ddd, MMM D")}
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {d.timeSlots.map((slot, index) => (
                            <Chip
                              key={index}
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Schedule fontSize="small" />
                                  <span style={{ fontFamily: "Kanit, sans-serif" }}>
                                    {slot.time}
                                  </span>
                                  {slot.multipleBookings ? (
                                    <Group fontSize="small" />
                                  ) : (
                                    <Person fontSize="small" />
                                  )}
                                </Box>
                              }
                              onDelete={() => removeTimeSlotFromDate(d._id, index)}
                              sx={{
                                backgroundColor: selectedBgColor,
                                color: "black",
                                fontFamily: "Kanit, sans-serif",
                                fontWeight: 500,
                                '& .MuiChip-deleteIcon': {
                                  color: selectedTextColor,
                                  '&:hover': {
                                    color: '#025530'
                                  }
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <IconButton
                          onClick={() => removeAvailableDate(d._id)}
                          sx={{
                            color: "#D32F2F",
                            backgroundColor: "rgba(211, 47, 47, 0.1)",
                            '&:hover': {
                              backgroundColor: "rgba(211, 47, 47, 0.2)",
                              transform: "scale(1.1)"
                            },
                            transition: "all 0.2s ease"
                          }}
                          aria-label="delete entire date"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 6,
          textAlign: 'center'
        }}>
          <Box sx={{ 
            p: 3, 
            borderRadius: '50%', 
            backgroundColor: selectedBgColor,
            mb: 2
          }}>
            <Event sx={{ color: selectedTextColor, fontSize: 40 }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: "text.secondary", 
              mb: 1,
              fontFamily: "Kanit, sans-serif",
              fontWeight: 500
            }}
          >
            No Upcoming Availability
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "text.secondary",
              fontFamily: "Kanit, sans-serif",
            }}
          >
            You have no upcoming availability scheduled.
          </Typography>
        </Box>
      )}
    </StyledCard>
  );
};

export default AvailabilityManager;