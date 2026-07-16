import crypto from "node:crypto";
import { DateTime } from "luxon";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function sender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL || "bookmeprocodezela@gmail.com",
    name: process.env.BREVO_SENDER_NAME || "BookMePro",
  };
}

export async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
  textContent,
  tags = [],
  scheduledAt,
  idempotencyKey,
  attachment,
  batchId,
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Brevo email is not configured.");
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: sender(),
      to: Array.isArray(to) ? to : [to],
      subject,
      htmlContent,
      textContent,
      tags,
      ...(scheduledAt
        ? { scheduledAt: new Date(scheduledAt).toISOString() }
        : {}),
      ...(idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : {}),
      ...(attachment ? { attachment: [attachment] } : {}),
      ...(batchId ? { batchId } : {}),
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || data.code || `Brevo request failed (${response.status}).`,
    );
  }
  return data;
}

export async function cancelBrevoScheduledEmail(identifier) {
  if (!identifier || !process.env.BREVO_API_KEY) return false;
  const response = await fetch(
    `${BREVO_API_URL}/${encodeURIComponent(identifier)}`,
    {
      method: "DELETE",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      cache: "no-store",
    },
  );
  return response.ok || response.status === 404;
}

function appointmentDetails(appointment) {
  const zone =
    appointment.timeZone || appointment.selectedTimezone || "Australia/Sydney";
  const start = appointment.startAt
    ? DateTime.fromJSDate(new Date(appointment.startAt), {
        zone: "utc",
      }).setZone(zone)
    : DateTime.fromJSDate(new Date(appointment.selectedDate), { zone });
  const end = appointment.endAt
    ? DateTime.fromJSDate(new Date(appointment.endAt), { zone: "utc" }).setZone(
        zone,
      )
    : null;
  return {
    zone,
    date: start.toFormat("cccc, d LLLL yyyy"),
    time: end
      ? `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`
      : String(appointment.selectedTime || ""),
  };
}

function layout({ eyebrow, title, intro, rows, action }) {
  const rowHtml = rows
    .filter((row) => row.value)
    .map(
      (row) =>
        `<tr><td style="padding:7px 0;color:#6b7280;width:120px;vertical-align:top">${escapeHtml(row.label)}</td><td style="padding:7px 0;color:#16271f;font-weight:600">${escapeHtml(row.value)}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#16271f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:620px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #dce8e0"><tr><td style="background:#037D40;padding:22px 28px;color:#fff"><div style="font-size:22px;font-weight:700">BookMePro</div></td></tr><tr><td style="padding:30px 28px"><div style="color:#037D40;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(eyebrow)}</div><h1 style="font-size:26px;line-height:1.25;margin:10px 0 12px">${escapeHtml(title)}</h1><p style="color:#4b5563;line-height:1.65;margin:0 0 22px">${escapeHtml(intro)}</p><table role="presentation" width="100%" style="background:#f7faf8;border-radius:12px;padding:14px 18px">${rowHtml}</table>${action ? `<p style="margin:26px 0 0"><a href="${escapeHtml(action.href)}" style="display:inline-block;background:#037D40;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">${escapeHtml(action.label)}</a></p>` : ""}<p style="color:#6b7280;font-size:13px;line-height:1.5;margin:26px 0 0">This is a transactional message about your BookMePro account or booking.</p></td></tr></table></td></tr></table></body></html>`;
}

function calendarAttachment(appointment, coach) {
  if (!appointment.startAt || !appointment.endAt) return null;
  const format = (value) =>
    new Date(value)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://bookmepro.com.au";
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookMePro//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:bookmepro-${appointment._id}@bookmepro.com.au`,
    `DTSTAMP:${format(new Date())}`,
    `DTSTART:${format(appointment.startAt)}`,
    `DTEND:${format(appointment.endAt)}`,
    `SUMMARY:BookMePro session with ${String(coach?.name || "your coach").replace(/[\r\n,;]/g, " ")}`,
    `LOCATION:${String(appointment.location || appointment.googleMeetLink || "").replace(/[\r\n,;]/g, " ")}`,
    `URL:${baseUrl}/student-dashboard`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return {
    name: "bookmepro-booking.ics",
    content: Buffer.from(content).toString("base64"),
  };
}

export function renderAppointmentEmail({
  eventType,
  appointment,
  coach,
  recipientType,
}) {
  const details = appointmentDetails(appointment);
  const coachName =
    coach?.name ||
    `${coach?.firstName || ""} ${coach?.lastName || ""}`.trim() ||
    "your coach";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://bookmepro.com.au";
  const studentAction = {
    label: "View your bookings",
    href: `${baseUrl}/student-dashboard`,
  };
  const coachAction = {
    label: "Manage booking",
    href: `${baseUrl}/dashboard/my-bookings`,
  };
  const definitions = {
    booking_received: [
      "Request received",
      "Your booking request is with the coach",
      `We’ll notify you as soon as ${coachName} responds.`,
    ],
    new_booking_request: [
      "New request",
      "You have a new booking request",
      `${appointment.name} has requested a session.`,
    ],
    booking_approved: [
      "Booking confirmed",
      "Your session is confirmed",
      `${coachName} approved your booking. A calendar invitation is included when Calendar is connected.`,
    ],
    booking_declined: [
      "Booking update",
      "Your booking request was declined",
      `This time is no longer confirmed. You can return to ${coachName}’s profile to choose another available time.`,
    ],
    booking_cancelled_student: [
      "Booking cancelled",
      "Your booking has been cancelled",
      "The session is no longer scheduled.",
    ],
    booking_cancelled_coach: [
      "Booking cancelled",
      "A student booking was cancelled",
      `${appointment.name} is no longer attending this session.`,
    ],
    booking_rescheduled_student: [
      "Booking changed",
      "Your booking has been rescheduled",
      "Please review the updated date and time below.",
    ],
    booking_rescheduled_coach: [
      "Booking changed",
      "A booking has been rescheduled",
      "Please review the updated date and time below.",
    ],
    reminder_24h: [
      "Booking reminder",
      "Your session is tomorrow",
      `This is a reminder for your upcoming session with ${coachName}.`,
    ],
    reminder_1h: [
      "Booking reminder",
      "Your session starts in one hour",
      `Your session with ${coachName} is coming up shortly.`,
    ],
  };
  const [eyebrow, title, intro] = definitions[eventType] || [
    "Booking update",
    "BookMePro booking update",
    "Your booking has been updated.",
  ];
  const rows = [
    ...(recipientType === "coach"
      ? [{ label: "Student", value: appointment.name }]
      : [{ label: "Coach", value: coachName }]),
    { label: "Date", value: details.date },
    { label: "Time", value: `${details.time} (${details.zone})` },
    {
      label: "Location",
      value:
        appointment.location || appointment.googleMeetLink || "To be confirmed",
    },
    { label: "Status", value: appointment.status },
    { label: "Reference", value: String(appointment._id) },
  ];
  return {
    subject: `${title} — ${details.date}`,
    htmlContent: layout({
      eyebrow,
      title,
      intro,
      rows,
      action: recipientType === "coach" ? coachAction : studentAction,
    }),
    textContent: `${title}\n${intro}\n${details.date}\n${details.time} (${details.zone})\n${appointment.location || appointment.googleMeetLink || ""}`,
    attachment:
      eventType === "booking_approved"
        ? calendarAttachment(appointment, coach)
        : null,
  };
}

export function newBatchId() {
  return crypto.randomUUID();
}
