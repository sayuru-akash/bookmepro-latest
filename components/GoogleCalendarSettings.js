"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SyncIcon from "@mui/icons-material/Sync";
import LinkOffIcon from "@mui/icons-material/LinkOff";

const endpoint = "/api/integrations/google-calendar/status";

export default function GoogleCalendarSettings({ ownerType = "coach" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to load Calendar settings.");
      setData(result);
    } catch (error) {
      setMessage({ severity: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("calendar");
    if (result === "connected") {
      setMessage({
        severity: "success",
        text: "Google Calendar connected and synchronized.",
      });
    } else if (result === "connection_failed") {
      setMessage({
        severity: "error",
        text: "Google Calendar could not be connected. Try again and approve every requested Calendar permission.",
      });
    }
  }, []);

  const writableCalendars = useMemo(
    () =>
      (data?.calendars || []).filter((calendar) =>
        calendar.accessRole === "owner",
      ),
    [data?.calendars],
  );

  const toggleBusyCalendar = (id) => {
    const current = new Set(data.busyCalendarIds || []);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    setData((value) => ({ ...value, busyCalendarIds: [...current] }));
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          busyCalendarIds: data.busyCalendarIds,
          destinationCalendarId: data.destinationCalendarId,
          createGoogleMeet: data.createGoogleMeet,
          addPendingHolds: data.addPendingHolds,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Unable to save Calendar settings.");
      setData(result);
      setMessage({
        severity: "success",
        text: "Google Calendar settings saved and synchronized.",
      });
    } catch (error) {
      setMessage({ severity: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const sync = async () => {
    setSaving(true);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Synchronization failed.");
      await load();
      setMessage({
        severity: "success",
        text: "Google Calendar is synchronized.",
      });
    } catch (error) {
      setMessage({ severity: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (
      !window.confirm(
        "Disconnect Google Calendar and remove BookMePro’s stored access tokens?",
      )
    )
      return;
    setSaving(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Disconnect failed.");
      setData({ connected: false, status: "disconnected", calendars: [] });
      setMessage({ severity: "success", text: result.message });
    } catch (error) {
      setMessage({ severity: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid rgba(3,125,64,.14)",
        boxShadow: "0 8px 32px rgba(0,0,0,.07)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2,
                bgcolor: "#D1E8D5",
                display: "grid",
                placeItems: "center",
              }}
            >
              <CalendarMonthIcon sx={{ color: "#037D40" }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontFamily: "Kanit", fontWeight: 700 }}
              >
                Google Calendar
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: "Kanit" }}
              >
                {ownerType === "coach"
                  ? "Prevent conflicts and keep approved bookings synchronized."
                  : "Optionally warn you when a booking conflicts with your calendar."}
              </Typography>
            </Box>
          </Box>
          {data?.connected && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Connected"
              color="success"
              variant="outlined"
            />
          )}
        </Stack>

        {message && (
          <Alert severity={message.severity} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
            <CircularProgress sx={{ color: "#037D40" }} />
          </Box>
        ) : !data?.connected ? (
          <Box sx={{ mt: 3, p: 2.5, bgcolor: "#f7faf8", borderRadius: 2 }}>
            {data?.status === "needs_reauth" && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Google access has expired or was revoked. Reconnect Calendar to
                restore conflict checks and synchronization.
              </Alert>
            )}
            {data?.status === "error" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Calendar synchronization needs attention. Reconnect to restore
                the integration.
              </Alert>
            )}
            <Typography
              sx={{ fontFamily: "Kanit", color: "text.secondary", mb: 2 }}
            >
              Google sign-in and Calendar access are separate. Connecting here
              only grants the Calendar permissions shown by Google.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CalendarMonthIcon />}
              href={`/api/integrations/google-calendar/connect?ownerType=${ownerType}`}
              sx={{
                bgcolor: "#037D40",
                textTransform: "none",
                fontFamily: "Kanit",
                fontWeight: 700,
                "&:hover": { bgcolor: "#02692D" },
              }}
            >
              Connect Google Calendar
            </Button>
          </Box>
        ) : (
          <Stack spacing={3} sx={{ mt: 3 }}>
            <Box sx={{ p: 2, bgcolor: "#f7faf8", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Connected account
              </Typography>
              <Typography sx={{ fontFamily: "Kanit", fontWeight: 600 }}>
                {data.googleEmail}
              </Typography>
              {data.lastSyncedAt && (
                <Typography variant="caption" color="text.secondary">
                  Last synced {new Date(data.lastSyncedAt).toLocaleString()}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography sx={{ fontFamily: "Kanit", fontWeight: 700, mb: 1 }}>
                Check conflicts in
              </Typography>
              <Stack>
                {(data.calendars || []).map((calendar) => (
                  <FormControlLabel
                    key={calendar.id}
                    control={
                      <Checkbox
                        checked={(data.busyCalendarIds || []).includes(
                          calendar.id,
                        )}
                        onChange={() => toggleBusyCalendar(calendar.id)}
                        sx={{
                          color: "#037D40",
                          "&.Mui-checked": { color: "#037D40" },
                        }}
                      />
                    }
                    label={`${calendar.summary}${calendar.primary ? " (Primary)" : ""}`}
                  />
                ))}
              </Stack>
            </Box>

            {ownerType === "coach" && (
              <>
                <Box>
                  <Typography
                    sx={{ fontFamily: "Kanit", fontWeight: 700, mb: 1 }}
                  >
                    Add BookMePro events to
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={data.destinationCalendarId || ""}
                    onChange={(event) =>
                      setData((value) => ({
                        ...value,
                        destinationCalendarId: event.target.value,
                      }))
                    }
                  >
                    {writableCalendars.map((calendar) => (
                      <MenuItem value={calendar.id} key={calendar.id}>
                        {calendar.summary}
                        {calendar.primary ? " (Primary)" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.75 }}
                  >
                    Only calendars owned by this account are available because
                    BookMePro uses Google&apos;s least-privilege owned-events
                    permission.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={data.addPendingHolds !== false}
                      onChange={(event) =>
                        setData((value) => ({
                          ...value,
                          addPendingHolds: event.target.checked,
                        }))
                      }
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#037D40",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          { bgcolor: "#037D40" },
                      }}
                    />
                  }
                  label="Add private tentative holds for pending requests"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(data.createGoogleMeet)}
                      onChange={(event) =>
                        setData((value) => ({
                          ...value,
                          createGoogleMeet: event.target.checked,
                        }))
                      }
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#037D40",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                          { bgcolor: "#037D40" },
                      }}
                    />
                  }
                  label="Create Google Meet for bookings without a physical location"
                />
              </>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={save}
                disabled={saving}
                sx={{
                  bgcolor: "#037D40",
                  textTransform: "none",
                  fontFamily: "Kanit",
                  "&:hover": { bgcolor: "#02692D" },
                }}
              >
                {saving ? "Saving…" : "Save Calendar Settings"}
              </Button>
              {ownerType === "coach" && (
                <Button
                  variant="outlined"
                  startIcon={<SyncIcon />}
                  onClick={sync}
                  disabled={saving}
                  sx={{
                    color: "#037D40",
                    borderColor: "#037D40",
                    textTransform: "none",
                  }}
                >
                  Sync now
                </Button>
              )}
              <Button
                variant="text"
                color="error"
                startIcon={<LinkOffIcon />}
                onClick={disconnect}
                disabled={saving}
                sx={{ textTransform: "none" }}
              >
                Disconnect
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
