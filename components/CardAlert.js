"use client";
import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import EmailIcon from "@mui/icons-material/Email";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { useSession } from "next-auth/react";

const StudentStatsCard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ emailCount: 0 });
  const [planStatus, setPlanStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) {
        setError("Coach ID is missing.");
        setLoading(false);
        return;
      }

      try {
        // Fetch both student count and plan status in parallel
        const [statsResponse, planResponse] = await Promise.all([
          axios.get(`/api/student-count?coachId=${session.user.id}`),
          axios.post("/api/coach/check-plan", { coachId: session.user.id }),
        ]);

        setStats({
          emailCount: statsResponse.data.emailCount || 0,
        });

        setPlanStatus(planResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const handleUpgradeClick = () => {
    setShowUpgradeDialog(true);
  };

  const handleUpgradeConfirm = () => {
    // Redirect to pricing page or handle upgrade logic
    window.location.href = `/pricing?recommended=${planStatus.data.recommendedPlan.plan}&current=${planStatus.data.currentPlan.plan}`;
  };

  const getStatusColor = () => {
    if (!planStatus) return "default";

    if (planStatus.status === "OK") {
      return planStatus.data.usagePercentage > 80 ? "warning" : "success";
    }
    return planStatus.action === "upgrade" ? "error" : "info";
  };

  const getStatusIcon = () => {
    if (!planStatus) return <EmailIcon />;

    if (planStatus.status === "OK") {
      return planStatus.data.usagePercentage > 80 ? (
        <WarningIcon />
      ) : (
        <CheckCircleIcon />
      );
    }
    return <TrendingUpIcon />;
  };

  const getUsagePercentage = () => {
    if (!planStatus?.data) return 0;
    return planStatus.data.usagePercentage || 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ m: 1.5, bgcolor: "#fff4f4" }}>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Grid container spacing={2} sx={{ p: 2 }}>
        <Grid item xs={12} md={6}>
          <Card
            variant="outlined"
            sx={{
              m: 1,
              background: "linear-gradient(135deg, #037D40 0%, #025B2F 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {getStatusIcon()}
                <Box sx={{ ml: 1, flexGrow: 1 }}>
                  <Typography variant="h6" component="div">
                    Total Students/Clients
                  </Typography>
                  {planStatus?.data && (
                    <Chip
                      label={`${planStatus.data.currentPlan.plan.toUpperCase()} Plan`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "white",
                        mt: 0.5,
                      }}
                    />
                  )}
                </Box>
              </Box>

              <Typography variant="h3" component="div" sx={{ mb: 1 }}>
                {stats.emailCount}
              </Typography>

              {planStatus?.data && (
                <Box sx={{ mt: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2">Plan Usage</Typography>
                    <Typography variant="body2">
                      {stats.emailCount} /{" "}
                      {planStatus.data.currentPlan.studentLimit}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(getUsagePercentage(), 100)}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.3)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor:
                          getUsagePercentage() > 90
                            ? "#ff4444"
                            : getUsagePercentage() > 80
                              ? "#ffaa00"
                              : "#ffffff",
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Plan Status Alert Card */}
        {planStatus && planStatus.status === "ACTION_REQUIRED" && (
          <Grid item xs={12}>
            <Alert
              severity={planStatus.action === "upgrade" ? "warning" : "info"}
              sx={{ m: 1 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleUpgradeClick}
                  variant="outlined"
                >
                  {planStatus.action === "upgrade"
                    ? "Upgrade Now"
                    : "Change Plan"}
                </Button>
              }
            >
              <AlertTitle>
                Plan {planStatus.action === "upgrade" ? "Upgrade" : "Change"}{" "}
                Required
              </AlertTitle>
              {planStatus.message}
            </Alert>
          </Grid>
        )}

        {/* Usage Warning Card */}
        {planStatus &&
          planStatus.status === "OK" &&
          getUsagePercentage() > 80 && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ m: 1 }}>
                <AlertTitle>Approaching Plan Limit</AlertTitle>
                You&apos;re using {getUsagePercentage()}% of your plan capacity.
                Consider upgrading soon to avoid service interruption.
              </Alert>
            </Grid>
          )}
      </Grid>

      {/* Upgrade Dialog */}
      <Dialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
      >
        <DialogTitle>
          {planStatus?.action === "upgrade"
            ? "Upgrade Your Plan"
            : "Change Your Plan"}
        </DialogTitle>
        <DialogContent>
          {planStatus?.data && (
            <Box>
              <Typography paragraph>{planStatus.message}</Typography>

              <Box display="flex" justifyContent="space-between" mb={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Plan
                  </Typography>
                  <Typography variant="h6">
                    {planStatus.data.currentPlan.plan.toUpperCase()} -{" "}
                    {planStatus.data.currentPlan.billingCycle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Up to {planStatus.data.currentPlan.studentLimit} students
                  </Typography>
                </Box>

                <TrendingUpIcon
                  sx={{ mx: 2, alignSelf: "center", color: "text.secondary" }}
                />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Recommended Plan
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {planStatus.data.recommendedPlan.plan.toUpperCase()} -{" "}
                    {planStatus.data.recommendedPlan.billingCycle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Up to {planStatus.data.recommendedPlan.studentLimit}{" "}
                    students
                  </Typography>
                </Box>
              </Box>

              {planStatus.data.alternatives &&
                planStatus.data.alternatives.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" mb={1}>
                      Alternative Billing Options:
                    </Typography>
                    {planStatus.data.alternatives.map((alt, index) => (
                      <Chip
                        key={index}
                        label={`${alt.plan.toUpperCase()} - ${alt.billingCycle}`}
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpgradeDialog(false)}>Later</Button>
          <Button onClick={handleUpgradeConfirm} variant="contained">
            {planStatus?.action === "upgrade" ? "Upgrade Now" : "Change Plan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StudentStatsCard;
