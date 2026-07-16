import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import connectToDatabase from "../mongodb";
import CalendarConnection from "../../models/CalendarConnection";
import { decryptSecret, encryptSecret } from "../security/secretBox";
import { ACTIVE_APPOINTMENT_STATUSES } from "../booking/time";
import { calendarEventDisposition } from "./calendarPolicy";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_URL = "https://www.googleapis.com/calendar/v3";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const GOOGLE_CALENDAR_SCOPES = {
  common: [
    "openid",
    "email",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    "https://www.googleapis.com/auth/calendar.events.freebusy",
  ],
  coach: ["https://www.googleapis.com/auth/calendar.events.owned"],
};

function oauthConfig() {
  const clientId =
    process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google Calendar OAuth is not configured.");
  }
  return { clientId, clientSecret };
}

export function googleCalendarRedirectUri() {
  const base =
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/integrations/google-calendar/callback`;
  return base;
}

export function googleCalendarAuthUrl({ ownerType, state }) {
  const { clientId } = oauthConfig();
  const scopes = [
    ...GOOGLE_CALENDAR_SCOPES.common,
    ...(ownerType === "coach" ? GOOGLE_CALENDAR_SCOPES.coach : []),
  ];
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleCalendarRedirectUri(),
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: scopes.join(" "),
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

async function tokenRequest(params) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      data.error_description || data.error || "Google OAuth failed.",
    );
    error.status = response.status;
    error.googleCode = data.error;
    throw error;
  }
  return data;
}

export async function exchangeGoogleCalendarCode(code) {
  const { clientId, clientSecret } = oauthConfig();
  return tokenRequest({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: googleCalendarRedirectUri(),
    grant_type: "authorization_code",
  });
}

async function refreshGoogleAccessToken(connection) {
  const { clientId, clientSecret } = oauthConfig();
  try {
    const tokens = await tokenRequest({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptSecret(connection.refreshTokenEncrypted),
      grant_type: "refresh_token",
    });
    connection.accessTokenEncrypted = encryptSecret(tokens.access_token);
    connection.accessTokenExpiresAt = new Date(
      Date.now() + Number(tokens.expires_in || 3600) * 1000,
    );
    connection.status = "connected";
    connection.lastError = null;
    if (tokens.scope) connection.scopes = tokens.scope.split(" ");
    await connection.save();
    return tokens.access_token;
  } catch (error) {
    connection.status =
      error.googleCode === "invalid_grant" ? "needs_reauth" : "error";
    connection.lastError = String(error.message).slice(0, 500);
    await connection.save();
    throw error;
  }
}

export async function accessTokenForConnection(connection) {
  if (
    connection.status === "connected" &&
    connection.accessTokenExpiresAt &&
    new Date(connection.accessTokenExpiresAt).getTime() > Date.now() + 120_000
  ) {
    return decryptSecret(connection.accessTokenEncrypted);
  }
  return refreshGoogleAccessToken(connection);
}

async function googleFetch(connection, path, options = {}) {
  const accessToken = await accessTokenForConnection(connection);
  const response = await fetch(
    path.startsWith("http") ? path : `${GOOGLE_API_URL}${path}`,
    {
      ...options,
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    },
  );
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        data?.error_description ||
        "Google Calendar request failed.",
    );
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

export async function googleProfileFromToken(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error("Unable to read the connected Google account.");
  return data;
}

export async function saveGoogleCalendarConnection({
  ownerType,
  ownerId,
  tokens,
}) {
  await connectToDatabase();
  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return offline access. Please reconnect and approve access.",
    );
  }
  const profile = await googleProfileFromToken(tokens.access_token);
  const scopeList = String(tokens.scope || "")
    .split(" ")
    .filter(Boolean);
  const connection = await CalendarConnection.findOneAndUpdate(
    { ownerType, ownerId: new ObjectId(ownerId) },
    {
      $set: {
        googleEmail: profile.email || "",
        accessTokenEncrypted: encryptSecret(tokens.access_token),
        refreshTokenEncrypted: encryptSecret(tokens.refresh_token),
        accessTokenExpiresAt: new Date(
          Date.now() + Number(tokens.expires_in || 3600) * 1000,
        ),
        scopes: scopeList,
        status: "connected",
        lastError: null,
      },
      $setOnInsert: {
        busyCalendarIds: ["primary"],
        destinationCalendarId: "primary",
        createGoogleMeet: false,
        addPendingHolds: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return connection;
}

export async function getCalendarConnection(ownerType, ownerId) {
  await connectToDatabase();
  if (!ObjectId.isValid(ownerId)) return null;
  return CalendarConnection.findOne({
    ownerType,
    ownerId: new ObjectId(ownerId),
  });
}

export async function listGoogleCalendars(connection) {
  const calendars = [];
  let pageToken = null;
  do {
    const params = new URLSearchParams({
      minAccessRole: "reader",
      showHidden: "false",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await googleFetch(
      connection,
      `/users/me/calendarList?${params}`,
    );
    calendars.push(
      ...(data.items || []).map((item) => ({
        id: item.id,
        summary: item.summary || item.id,
        primary: Boolean(item.primary),
        accessRole: item.accessRole,
        timeZone: item.timeZone || null,
        backgroundColor: item.backgroundColor || null,
      })),
    );
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return calendars;
}

export async function queryGoogleFreeBusy(
  connection,
  { timeMin, timeMax, calendarIds },
) {
  const ids = [...new Set((calendarIds || []).filter(Boolean))];
  if (!ids.length) return [];
  const data = await googleFetch(connection, "/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: new Date(timeMin).toISOString(),
      timeMax: new Date(timeMax).toISOString(),
      items: ids.map((id) => ({ id })),
    }),
  });
  return Object.entries(data.calendars || {}).flatMap(([calendarId, value]) =>
    (value.busy || []).map((busy) => ({ ...busy, calendarId })),
  );
}

export async function busyIntervalsForOwner(ownerType, ownerId, interval) {
  const connection = await getCalendarConnection(ownerType, ownerId);
  if (!connection || connection.status !== "connected") return [];
  return queryGoogleFreeBusy(connection, {
    ...interval,
    calendarIds: connection.busyCalendarIds?.length
      ? connection.busyCalendarIds
      : ["primary"],
  });
}

function eventIdForAppointment(appointment) {
  if (appointment.multipleBookings && appointment.groupKey) {
    return `bmpg${crypto.createHash("sha256").update(appointment.groupKey).digest("hex").slice(0, 40)}`;
  }
  return `bmp${String(appointment._id).toLowerCase()}`;
}

function eventUrl(connection, eventId) {
  return `/calendars/${encodeURIComponent(connection.destinationCalendarId || "primary")}/events/${encodeURIComponent(eventId)}`;
}

async function appointmentEventState(db, appointment) {
  if (!appointment.multipleBookings || !appointment.groupKey) {
    return { anchor: appointment, appointments: [appointment] };
  }
  const appointments = await db
    .collection("appointments")
    .find({
      groupKey: appointment.groupKey,
      status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    })
    .sort({ createdAt: 1 })
    .toArray();
  return { anchor: appointments[0] || appointment, appointments };
}

function buildEventBody({
  appointment,
  appointments,
  connection,
  attendeeEmailByStudent,
}) {
  const approved = appointments.filter((item) => item.status === "approved");
  const confirmed = approved.length > 0;
  const attendees = Array.from(
    new Map(
      approved
        .map((item) => ({
          email:
            attendeeEmailByStudent.get(String(item.studentId)) || item.email,
          displayName: item.name || undefined,
        }))
        .filter((item) => item.email)
        .map((item) => [item.email.toLowerCase(), item]),
    ).values(),
  );
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://bookmepro.com.au";
  const body = {
    summary: confirmed
      ? appointment.multipleBookings
        ? "BookMePro group session"
        : `BookMePro session with ${appointment.name}`
      : "Pending BookMePro booking",
    description: `Managed by BookMePro. Booking reference: ${appointment._id}\n${baseUrl}/dashboard/my-bookings`,
    start: {
      dateTime: new Date(appointment.startAt).toISOString(),
      timeZone: appointment.timeZone,
    },
    end: {
      dateTime: new Date(appointment.endAt).toISOString(),
      timeZone: appointment.timeZone,
    },
    location: appointment.location || undefined,
    visibility: "private",
    transparency: appointment.multipleBookings ? "transparent" : "opaque",
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
    extendedProperties: {
      private: {
        bookmeproAppointmentId: String(appointment._id),
        ...(appointment.groupKey
          ? { bookmeproGroupKey: appointment.groupKey }
          : {}),
      },
    },
  };
  if (confirmed && connection.createGoogleMeet && !appointment.location) {
    body.conferenceData = {
      createRequest: {
        requestId: `bmp-${eventIdForAppointment(appointment)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  return body;
}

export async function syncAppointmentToGoogle(appointmentId) {
  const connection = await connectToDatabase();
  const db = connection.db;
  const appointment = await db.collection("appointments").findOne({
    _id: new ObjectId(appointmentId),
  });
  if (!appointment) return { skipped: "appointment_missing" };
  const calendarConnection = await getCalendarConnection(
    "coach",
    appointment.coachId,
  );
  if (!calendarConnection || calendarConnection.status !== "connected") {
    return { skipped: "coach_not_connected" };
  }

  const eventId = eventIdForAppointment(appointment);
  const { anchor, appointments } = await appointmentEventState(db, appointment);
  const active = appointments.filter((item) =>
    ACTIVE_APPOINTMENT_STATUSES.includes(item.status),
  );

  if (
    calendarEventDisposition(
      active,
      calendarConnection.addPendingHolds !== false,
    ) === "delete"
  ) {
    try {
      await googleFetch(
        calendarConnection,
        `${eventUrl(calendarConnection, eventId)}?sendUpdates=all`,
        { method: "DELETE" },
      );
    } catch (error) {
      if (error.status !== 404 && error.status !== 410) throw error;
    }
    const updateFilter = appointment.groupKey
      ? { groupKey: appointment.groupKey }
      : { _id: appointment._id };
    await db.collection("appointments").updateMany(updateFilter, {
      $set: { calendarSyncError: null },
      $unset: {
        externalCalendarEventId: "",
        externalCalendarHtmlLink: "",
        googleMeetLink: "",
        calendarSyncedAt: "",
      },
    });
    return { deleted: true, eventId };
  }

  const studentOwnerIds = active
    .map((item) => String(item.studentId))
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const studentConnections = studentOwnerIds.length
    ? await db
        .collection("calendarconnections")
        .find(
          {
            ownerType: "student",
            ownerId: { $in: studentOwnerIds },
            status: "connected",
          },
          { projection: { ownerId: 1, googleEmail: 1 } },
        )
        .toArray()
    : [];
  const attendeeEmailByStudent = new Map(
    studentConnections.map((item) => [String(item.ownerId), item.googleEmail]),
  );

  const body = buildEventBody({
    appointment: anchor,
    appointments: active,
    connection: calendarConnection,
    attendeeEmailByStudent,
  });
  const params = new URLSearchParams({
    sendUpdates: body.attendees.length ? "all" : "none",
    conferenceDataVersion: "1",
  });
  let event;
  try {
    event = await googleFetch(
      calendarConnection,
      `${eventUrl(calendarConnection, eventId)}?${params}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
    );
  } catch (error) {
    if (error.status !== 404) throw error;
    event = await googleFetch(
      calendarConnection,
      `/calendars/${encodeURIComponent(calendarConnection.destinationCalendarId || "primary")}/events?${params}`,
      { method: "POST", body: JSON.stringify({ id: eventId, ...body }) },
    );
  }

  const updateFilter = appointment.groupKey
    ? { groupKey: appointment.groupKey }
    : { _id: appointment._id };
  await db.collection("appointments").updateMany(updateFilter, {
    $set: {
      externalCalendarEventId: event.id,
      externalCalendarHtmlLink: event.htmlLink || null,
      googleMeetLink: event.hangoutLink || null,
      calendarSyncedAt: new Date(),
      calendarSyncError: null,
    },
  });
  return { eventId: event.id, htmlLink: event.htmlLink || null };
}

function webhookBaseUrl() {
  return (
    process.env.GOOGLE_CALENDAR_WEBHOOK_URL ||
    `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "https://bookmepro.com.au"}/api/webhooks/google-calendar`
  );
}

export async function ensureGoogleCalendarWatch(connection) {
  if (connection.ownerType !== "coach" || connection.status !== "connected")
    return null;
  const calendarId = connection.destinationCalendarId || "primary";
  const current = (connection.watchChannels || []).find(
    (item) =>
      item.calendarId === calendarId &&
      new Date(item.expiration) > new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  if (current) return current;

  const channelId = crypto.randomUUID();
  const token = crypto.randomBytes(24).toString("base64url");
  const data = await googleFetch(
    connection,
    `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookBaseUrl(),
        token,
        expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    },
  );
  connection.watchChannels = [
    ...(connection.watchChannels || []).filter(
      (item) => item.calendarId !== calendarId,
    ),
    {
      calendarId,
      channelId,
      resourceId: data.resourceId,
      token,
      expiration: new Date(Number(data.expiration)),
    },
  ];
  await connection.save();
  return connection.watchChannels.at(-1);
}

export async function stopGoogleCalendarWatches(connection) {
  for (const channel of connection.watchChannels || []) {
    try {
      await googleFetch(connection, "/channels/stop", {
        method: "POST",
        body: JSON.stringify({
          id: channel.channelId,
          resourceId: channel.resourceId,
        }),
      });
    } catch {
      // Expired/revoked channels need no further cleanup.
    }
  }
  connection.watchChannels = [];
  await connection.save();
}

export async function syncGoogleDestinationCalendar(connection) {
  if (!connection || connection.status !== "connected")
    return { skipped: true };
  const params = new URLSearchParams({
    showDeleted: "true",
    singleEvents: "true",
    maxResults: "2500",
  });
  if (connection.syncToken) params.set("syncToken", connection.syncToken);
  else
    params.set(
      "timeMin",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );

  let pageToken = null;
  let nextSyncToken = connection.syncToken;
  const changedAppointmentIds = new Set();
  try {
    do {
      if (pageToken) params.set("pageToken", pageToken);
      const data = await googleFetch(
        connection,
        `/calendars/${encodeURIComponent(connection.destinationCalendarId || "primary")}/events?${params}`,
      );
      for (const event of data.items || []) {
        const id = event.extendedProperties?.private?.bookmeproAppointmentId;
        if (id && ObjectId.isValid(id)) changedAppointmentIds.add(id);
      }
      pageToken = data.nextPageToken || null;
      nextSyncToken = data.nextSyncToken || nextSyncToken;
    } while (pageToken);
  } catch (error) {
    if (error.status === 410 && connection.syncToken) {
      connection.syncToken = null;
      await connection.save();
      return syncGoogleDestinationCalendar(connection);
    }
    throw error;
  }

  connection.syncToken = nextSyncToken;
  connection.lastSyncedAt = new Date();
  connection.lastError = null;
  await connection.save();
  for (const appointmentId of changedAppointmentIds) {
    await syncAppointmentToGoogle(appointmentId);
  }
  return { changed: changedAppointmentIds.size };
}

export async function revokeGoogleCalendarConnection(connection) {
  await stopGoogleCalendarWatches(connection);
  try {
    const token = decryptSecret(connection.refreshTokenEncrypted);
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        cache: "no-store",
      },
    );
  } finally {
    await connection.deleteOne();
  }
}
