"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardContent, Chip, CircularProgress, Container, Grid, Typography, Paper } from "@mui/material";
import CreditCard from '@mui/icons-material/CreditCard';
import { Delete, Event } from "@mui/icons-material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AccountDetails = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [coachData, setCoachData] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch coach data and payment methods in parallel for better performance
        const [coachResponse, paymentResponse] = await Promise.all([
          axios.get(`/api/coach/${session.user.id}`),
          axios.get(`/api/stripe/get-payment-methods?customerId=${session.user.id}`),
        ]);

        setCoachData(coachResponse.data);
        setPaymentMethods(paymentResponse.data.paymentMethods || []);

      } catch (error) {
        console.error("Error fetching account details:", error);
        toast.error("Failed to load account details.", { toastId: "fetch-error" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleDeletePaymentMethod = async (paymentMethodId) => {
    // Critical action: Confirm with the user before proceeding
    const isConfirmed = window.confirm(
      "Are you sure? This will remove your payment method and cancel your active subscription."
    );

    if (!isConfirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.post("/api/stripe/delete-payment-method", {
        paymentMethodId,
      });

      if (response.data.success) {
        // Update state locally for an immediate UI response
        setPaymentMethods((prev) => prev.filter((pm) => pm.id !== paymentMethodId));
        setCoachData((c) => (c ? { ...c, paymentStatus: "inactive" } : c));
        
        toast.success("Subscription canceled successfully.", { toastId: "delete-success" });

        // Optional: Force a page reload if other components need to be updated.
        // router.refresh(); 
      } else {
        throw new Error(response.data.error || "API returned an error.");
      }
    } catch (err) {
      console.error("Error deleting payment method:", err);
      toast.error("Could not cancel subscription. Please try again.", { toastId: "delete-error" });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPaymentMethods = paymentMethods.length > 0;

  return (
  <Box 
    sx={{ 
      minHeight: '100vh',
      ml:4,
      mr:8,
      paddingTop: {
        xs: "42px",
        sm: "52px",
        md: "30px",
      },
      overflow: "auto",
      backgroundColor: "white",
      fontFamily: "Kanit, sans-serif",
    }}
  >
    {/* <Container 
      maxWidth="lg"
    > */}

      {/* Header Section */}
      <Box 
        sx={{ 
          mb: { xs: 4, md: 2 },
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1,
          }}
        >
          <Event sx={{ 
            fontSize: 28, 
            color: '#1a1a1a' 
          }} />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600,
              color: '#1a1a1a',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              fontFamily: "Kanit, sans-serif", 
            }}
          >
            Account Details
          </Typography>
        </Box>
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666',
            fontSize: { xs: '0.95rem', md: '1rem' },
            ml: 5,
            fontFamily: "Kanit, sans-serif", 
          }}
        >
          Manage your subscription and billing information
        </Typography>
      </Box>

      {isLoading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 300,
            flexDirection: 'column',
            gap: 3
          }}
        >
          <CircularProgress 
            size={48} 
            sx={{ color: '#036b34' }}
          />
          <Typography sx={{ color: '#666', fontSize: '0.95rem', fontFamily: "Kanit, sans-serif" }}>
            Loading your account details...
          </Typography>
        </Box>
      ) : coachData ? (
        <Box>
          {/* Account Info Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  fontFamily: "Kanit, sans-serif", 
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#036b34',
                    transform: "translateY(-8px)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"                    
                  }
                }}
              >
                <Typography 
                  variant="overline" 
                  sx={{ 
                    color: '#666',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    fontFamily: "Kanit, sans-serif", 
                  }}
                >
                  Current Plan
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#1a1a1a',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    mt: 1,
                    fontFamily: "Kanit, sans-serif", 
                  }}
                >
                  {coachData.plan || "Not Available"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  fontFamily: "Kanit, sans-serif", 
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#036b34',
                    transform: "translateY(-8px)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
                  }
                }}
              >
                <Typography 
                  variant="overline" 
                  sx={{ 
                    color: '#666',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    fontFamily: "Kanit, sans-serif", 
                  }}
                >
                  Billing Cycle
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#1a1a1a',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    mt: 1,
                    fontFamily: "Kanit, sans-serif", 
                  }}
                >
                  {coachData.billingCycle || "Not Available"}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  height: '100%',
                  transition: 'all 0.2s ease',
                  fontFamily: "Kanit, sans-serif", 
                  '&:hover': {
                    borderColor: '#036b34',
                    transform: "translateY(-8px)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
                  }
                }}
              >
                <Typography 
                  variant="overline" 
                  sx={{ 
                    color: '#666',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                    fontFamily: "Kanit, sans-serif", 
                  }}
                >
                  Payment Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={coachData.paymentStatus || "Not Available"}
                    size="medium"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      fontFamily: "Kanit, sans-serif", 
                      bgcolor: coachData.paymentStatus === "active" ? '#e8f5e8' :
                               coachData.paymentStatus === "inactive" ? '#ffeaea' : '#fff3e0',
                      color: coachData.paymentStatus === "active" ? '#2e7d32' :
                             coachData.paymentStatus === "inactive" ? '#d32f2f' : '#f57c00',
                      border: `1px solid ${
                        coachData.paymentStatus === "active" ? '#c8e6c9' :
                        coachData.paymentStatus === "inactive" ? '#ffcdd2' : '#ffcc02'
                      }`,
                      '&:hover': {
                        bgcolor: coachData.paymentStatus === "active" ? '#dcedc8' :
                                 coachData.paymentStatus === "inactive" ? '#ffebee' : '#fff8e1',
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Payment Methods Section */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              overflow: 'hidden',
              fontFamily: "Kanit, sans-serif", 
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0'}}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#1a1a1a',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  fontFamily: "Kanit, sans-serif", 
                }}
              >
                <CreditCard sx={{ fontSize: 24, color: '#1a1a1a' }} />
                Subscription & Payment
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              {hasPaymentMethods ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {paymentMethods.map((method) => (
                    <Box
                      key={method.id}
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'stretch', md: 'center' },
                        justifyContent: 'space-between',
                        gap: { xs: 2, md: 3 },
                        p: 2.5,
                        bgcolor: '#f8f9fa',
                        borderRadius: 1.5,
                        border: '1px solid #e9ecef',
                        fontFamily: "Kanit, sans-serif", 
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: '#dee2e6',
                          bgcolor: '#f1f3f4'
                        }
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            color: '#1a1a1a',
                            fontWeight: 600,
                            mb: 0.5,
                            fontFamily: "Kanit, sans-serif", 
                            fontFamily: "Kanit, sans-serif", 
                          }}
                        >
                          {method.card.brand.toUpperCase()} •••• {method.card.last4}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            fontSize: '0.875rem',
                            fontFamily: "Kanit, sans-serif", 
                          }}
                        >
                          Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                        </Typography>
                      </Box>

                      <Button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        variant="outlined"
                        disabled={isDeleting}
                        startIcon={<Delete />}
                        sx={{
                          color: '#d32f2f',
                          borderColor: '#d32f2f',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontFamily: "Kanit, sans-serif", 
                          px: 2.5,
                          py: 1,
                          fontSize: '0.875rem',
                          borderRadius: 1.5,
                          minWidth: { xs: '100%', md: 'auto' },
                          '&:hover': {
                            borderColor: '#c62828',
                            bgcolor: '#ffebee',
                            color: '#c62828'
                          },
                          '&:disabled': {
                            borderColor: '#e0e0e0',
                            color: '#bdbdbd'
                          }
                        }}
                      >
                        {isDeleting ? "Canceling..." : "Cancel Subscription"}
                      </Button>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    py: 4,
                    color: '#666',
                    fontFamily: "Kanit, sans-serif", 
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      fontFamily: "Kanit, sans-serif", 
                    }}
                  >
                    No active subscription or payment method on file
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 0.5,
                      fontSize: '0.875rem',
                      color: '#999',
                      fontFamily: "Kanit, sans-serif", 
                    }}
                  >
                    Contact support if you need assistance
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#d32f2f',
              fontWeight: 600,
              mb: 1,
              fontFamily: "Kanit, sans-serif", 
            }}
          >
            Unable to Load Account Details
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#666',
              fontSize: '0.875rem',
              fontFamily: "Kanit, sans-serif", 
            }}
          >
            Please refresh the page or contact support if the issue persists
          </Typography>
        </Paper>
      )}
    {/* </Container> */}
    
  </Box>
  );
};

export default AccountDetails;