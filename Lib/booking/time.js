import { DateTime, IANAZone } from "luxon";

const TIME_FORMATS = ["HH:mm", "H:mm", "h:mm a", "h:mma"];

function parseTime(value, zone, dateKey) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  for (const format of TIME_FORMATS) {
    const parsed = DateTime.fromFormat(
      `${dateKey} ${normalized}`,
      `yyyy-MM-dd ${format}`,
      { zone, locale: "en" },
    );
    if (parsed.isValid) return parsed;
  }
  return null;
}

export function normalizeTimeZone(value, fallback = "Australia/Sydney") {
  const candidate = String(value || "").trim();
  return candidate && IANAZone.isValidZone(candidate) ? candidate : fallback;
}

export function dateKeyFromValue(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function appointmentInterval({ date, time, timeZone }) {
  const dateKey = dateKeyFromValue(date);
  const zone = normalizeTimeZone(timeZone);
  const [startValue, endValue] = String(time || "")
    .split(" - ")
    .map((part) => part?.trim());

  if (!dateKey || !startValue || !endValue) {
    throw new Error(
      "A valid appointment date and start/end time are required.",
    );
  }

  const start = parseTime(startValue, zone, dateKey);
  let end = parseTime(endValue, zone, dateKey);
  if (!start || !end) throw new Error("The selected time slot is invalid.");
  if (end <= start) end = end.plus({ days: 1 });

  return {
    dateKey,
    timeZone: zone,
    startAt: start.toUTC().toJSDate(),
    endAt: end.toUTC().toJSDate(),
    startIso: start.toUTC().toISO(),
    endIso: end.toUTC().toISO(),
  };
}

export function intervalsOverlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
}

export function normalizeAppointmentStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  const aliases = {
    accepted: "approved",
    rejected: "declined",
    canceled: "cancelled",
  };
  return aliases[normalized] || normalized;
}

export const ACTIVE_APPOINTMENT_STATUSES = ["pending", "approved"];
export const APPOINTMENT_STATUSES = [
  "pending",
  "approved",
  "declined",
  "cancelled",
  "completed",
  "no_show",
];

export function appointmentCapacityTransition({
  previousStatus,
  nextStatus,
  reservationReleased = false,
  groupChanged = false,
}) {
  const previousWasActive = ACTIVE_APPOINTMENT_STATUSES.includes(
    normalizeAppointmentStatus(previousStatus),
  );
  const nextIsActive = ACTIVE_APPOINTMENT_STATUSES.includes(
    normalizeAppointmentStatus(nextStatus),
  );
  const previousReservationExists =
    previousWasActive && reservationReleased !== true;

  return {
    reserveNext:
      nextIsActive && (!previousReservationExists || groupChanged),
    releasePrevious:
      previousReservationExists && (!nextIsActive || groupChanged),
    reservationReleased: !nextIsActive,
  };
}
