export function calendarEventDisposition(appointments, addPendingHolds = true) {
  const active = Array.isArray(appointments) ? appointments : [];
  if (!active.length) return "delete";
  if (active.some((appointment) => appointment.status === "approved")) {
    return "upsert";
  }
  return addPendingHolds ? "upsert" : "delete";
}
