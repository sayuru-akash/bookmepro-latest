export function calendarEventDisposition(appointments, addPendingHolds = true) {
  const active = Array.isArray(appointments) ? appointments : [];
  if (!active.length) return "delete";
  if (active.some((appointment) => appointment.status === "approved")) {
    return "upsert";
  }
  return addPendingHolds ? "upsert" : "delete";
}

const REQUIRED_COMMON_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
];

const COACH_OWNED_EVENTS_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.owned";

export function missingGoogleCalendarScopes(ownerType, scopes = []) {
  const granted = new Set(scopes);
  const required = [
    ...REQUIRED_COMMON_CALENDAR_SCOPES,
    ...(ownerType === "coach" ? [COACH_OWNED_EVENTS_SCOPE] : []),
  ];
  return required.filter((scope) => !granted.has(scope));
}

export function shouldReconcileGoogleEvent(event, appointment) {
  const eventUpdatedAt = new Date(event?.updated || 0).getTime();
  const calendarSyncedAt = new Date(appointment?.calendarSyncedAt || 0).getTime();
  if (!Number.isFinite(eventUpdatedAt) || eventUpdatedAt <= 0) return true;
  if (!Number.isFinite(calendarSyncedAt) || calendarSyncedAt <= 0) return true;
  return eventUpdatedAt > calendarSyncedAt;
}
