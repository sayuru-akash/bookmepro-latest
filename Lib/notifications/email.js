import crypto from "node:crypto";
import { DateTime } from "luxon";
import validator from "validator";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_WEBHOOK_EVENTS = [
  "request",
  "delivered",
  "hardBounce",
  "softBounce",
  "blocked",
  "spam",
  "invalid",
  "deferred",
  "unsubscribed",
];

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

export function brevoSender() {
  const email = String(process.env.BREVO_SENDER_EMAIL || "")
    .trim()
    .toLowerCase();
  if (!validator.isEmail(email)) {
    throw new Error(
      "BREVO_SENDER_EMAIL is not configured with a valid email address.",
    );
  }
  const name =
    String(process.env.BREVO_SENDER_NAME || "BookMePro").trim() || "BookMePro";
  return {
    email,
    name,
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
      sender: brevoSender(),
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

function brevoWebhookUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://bookmepro.com.au";
  return `${baseUrl.replace(/\/$/, "")}/api/webhooks/brevo`;
}

export function brevoWebhookIsCurrent(webhook, expectedUrl, secret) {
  try {
    const actual = new URL(webhook?.url);
    const expected = new URL(expectedUrl);
    const endpointMatches =
      actual.origin === expected.origin && actual.pathname === expected.pathname;
    const headerMatches = (webhook?.headers || []).some(
      (header) =>
        String(header.key || "").toLowerCase() ===
          "x-bookmepro-webhook-secret" && header.value === secret,
    );
    const queryMatches = actual.searchParams.get("token") === secret;
    const events = new Set(webhook?.events || []);
    return (
      endpointMatches &&
      (headerMatches || queryMatches) &&
      BREVO_WEBHOOK_EVENTS.every((event) => events.has(event))
    );
  } catch {
    return false;
  }
}

async function brevoApi(path, options = {}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Brevo email is not configured.");
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
      ...options.headers,
    },
    cache: "no-store",
  });
  if (response.status === 204) return {};
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data.message || data.code || `Brevo request failed (${response.status}).`,
    );
  }
  return data;
}

export async function ensureBrevoDeliveryWebhook() {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret) throw new Error("Brevo webhook authentication is not configured.");
  const expectedUrl = brevoWebhookUrl();
  const data = await brevoApi("/webhooks?type=transactional&sort=desc");
  const webhooks = data.webhooks || [];
  if (
    webhooks.some((webhook) =>
      brevoWebhookIsCurrent(webhook, expectedUrl, secret),
    )
  ) {
    return { status: "ok", action: "unchanged" };
  }

  const sameEndpoint = webhooks.find((webhook) => {
    try {
      const actual = new URL(webhook.url);
      const expected = new URL(expectedUrl);
      return (
        actual.origin === expected.origin &&
        actual.pathname === expected.pathname
      );
    } catch {
      return false;
    }
  });
  const configuration = {
    url: expectedUrl,
    description: "BookMePro transactional delivery tracking",
    events: BREVO_WEBHOOK_EVENTS,
    batched: false,
    headers: [{ key: "x-bookmepro-webhook-secret", value: secret }],
  };
  if (sameEndpoint) {
    await brevoApi(`/webhooks/${sameEndpoint.id}`, {
      method: "PUT",
      body: JSON.stringify(configuration),
    });
    return { status: "ok", action: "updated" };
  }
  await brevoApi("/webhooks", {
    method: "POST",
    body: JSON.stringify({ ...configuration, type: "transactional" }),
  });
  return { status: "ok", action: "created" };
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
  actorRole,
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
  const cancelledDefinition =
    recipientType === "coach"
      ? actorRole === "coach"
        ? [
            "Cancellation confirmed",
            "The booking has been cancelled",
            `The booking with ${appointment.name} is no longer scheduled.`,
          ]
        : [
            "Booking cancelled",
            "A student cancelled a booking",
            `${appointment.name} is no longer attending this session.`,
          ]
      : actorRole === "student"
        ? [
            "Cancellation confirmed",
            "Your booking has been cancelled",
            "Your cancellation has been recorded and the session is no longer scheduled.",
          ]
        : [
            "Booking cancelled",
            "Your coach cancelled this booking",
            `${coachName} cancelled this session. It is no longer scheduled.`,
          ];
  const rescheduledDefinition =
    recipientType === "coach"
      ? actorRole === "coach"
        ? [
            "Change confirmed",
            "The booking has been rescheduled",
            `Your change to the booking with ${appointment.name} is confirmed.`,
          ]
        : [
            "Booking changed",
            "A student rescheduled a booking",
            `${appointment.name} requested the updated date and time below.`,
          ]
      : actorRole === "student"
        ? [
            "Change confirmed",
            "Your booking has been rescheduled",
            "Your updated request is with the coach. Please review the new date and time below.",
          ]
        : [
            "Booking changed",
            "Your coach rescheduled this booking",
            `Please review the updated date and time from ${coachName}.`,
          ];
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
    booking_cancelled_student: cancelledDefinition,
    booking_cancelled_coach: cancelledDefinition,
    booking_rescheduled_student: rescheduledDefinition,
    booking_rescheduled_coach: rescheduledDefinition,
    booking_completed: [
      "Session complete",
      "Your session has been marked complete",
      `Your session with ${coachName} is now complete.`,
    ],
    booking_no_show: [
      "Booking update",
      "Your session was marked as missed",
      `The booking with ${coachName} was marked as a no-show. Contact your coach if this is incorrect.`,
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
