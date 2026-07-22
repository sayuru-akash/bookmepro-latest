import {
  requireSession,
  errorResponse,
} from "../../../../../Lib/auth/requireSession";
import {
  ensureGoogleCalendarWatch,
  getCalendarConnection,
  listGoogleCalendars,
  moveFutureManagedEvents,
  revokeGoogleCalendarConnection,
  stopGoogleCalendarWatches,
  syncGoogleDestinationCalendar,
} from "../../../../../Lib/integrations/googleCalendar";
import {
  drainCalendarOutbox,
  enqueueFutureCoachAppointments,
} from "../../../../../Lib/integrations/calendarOutbox";

export const maxDuration = 60;

async function pushBookMeProAppointments(connection) {
  await enqueueFutureCoachAppointments(connection.ownerId, 500, {
    force: true,
  });
  await drainCalendarOutbox({ limit: 100 });
}

function publicConnection(connection, calendars = []) {
  if (!connection)
    return { connected: false, status: "disconnected", calendars: [] };
  return {
    connected: connection.status === "connected",
    status: connection.status,
    googleEmail: connection.googleEmail,
    busyCalendarIds: connection.busyCalendarIds || [],
    destinationCalendarId: connection.destinationCalendarId || "primary",
    createGoogleMeet: Boolean(connection.createGoogleMeet),
    addPendingHolds: connection.addPendingHolds !== false,
    calendarTimeZone: connection.calendarTimeZone,
    lastSyncedAt: connection.lastSyncedAt,
    lastError: connection.lastError,
    calendars,
  };
}

async function context() {
  const session = await requireSession(["coach", "student"]);
  const ownerType = session.user.role === "student" ? "student" : "coach";
  const connection = await getCalendarConnection(ownerType, session.user.id);
  return { session, ownerType, connection };
}

export async function GET() {
  try {
    const { connection } = await context();
    const calendars =
      connection?.status === "connected"
        ? await listGoogleCalendars(connection)
        : [];
    return Response.json(publicConnection(connection, calendars));
  } catch (error) {
    return errorResponse(error, "Unable to load Calendar settings.");
  }
}

export async function PATCH(request) {
  try {
    const { ownerType, connection } = await context();
    if (!connection)
      return Response.json(
        { message: "Connect Google Calendar first." },
        { status: 404 },
      );
    const body = await request.json();
    const calendars = await listGoogleCalendars(connection);
    const allowed = new Set(calendars.map((calendar) => calendar.id));
    const busyCalendarIds = [...new Set(body.busyCalendarIds || [])].filter(
      (id) => allowed.has(id),
    );
    if (!busyCalendarIds.length) {
      return Response.json(
        { message: "Select at least one calendar for conflict checking." },
        { status: 400 },
      );
    }
    connection.busyCalendarIds = busyCalendarIds;
    if (ownerType === "coach") {
      if (!allowed.has(body.destinationCalendarId)) {
        return Response.json(
          { message: "Select a valid destination calendar." },
          { status: 400 },
        );
      }
      const destination = calendars.find(
        (item) => item.id === body.destinationCalendarId,
      );
      if (!destination || destination.accessRole !== "owner") {
        return Response.json(
          {
            message:
              "Choose a calendar owned by this Google account.",
          },
          { status: 400 },
        );
      }
      const destinationChanged =
        connection.destinationCalendarId !== body.destinationCalendarId;
      if (destinationChanged) {
        await moveFutureManagedEvents(connection, {
          fromCalendarId: connection.destinationCalendarId || "primary",
          toCalendarId: body.destinationCalendarId,
        });
        await stopGoogleCalendarWatches(connection);
      }
      connection.destinationCalendarId = body.destinationCalendarId;
      connection.createGoogleMeet = Boolean(body.createGoogleMeet);
      connection.addPendingHolds = body.addPendingHolds !== false;
      connection.calendarTimeZone =
        destination.timeZone || connection.calendarTimeZone;
      connection.syncToken = null;
    }
    await connection.save();
    if (ownerType === "coach") {
      await syncGoogleDestinationCalendar(connection);
      await ensureGoogleCalendarWatch(connection);
      await pushBookMeProAppointments(connection);
    }
    return Response.json(publicConnection(connection, calendars));
  } catch (error) {
    return errorResponse(error, "Unable to save Calendar settings.");
  }
}

export async function POST() {
  try {
    const { ownerType, connection } = await context();
    if (!connection)
      return Response.json(
        { message: "Connect Google Calendar first." },
        { status: 404 },
      );
    if (ownerType === "coach") {
      await syncGoogleDestinationCalendar(connection);
      await ensureGoogleCalendarWatch(connection);
      await pushBookMeProAppointments(connection);
    }
    return Response.json({
      message: "Calendar synchronization completed.",
      lastSyncedAt: new Date(),
    });
  } catch (error) {
    return errorResponse(error, "Calendar synchronization failed.");
  }
}

export async function DELETE() {
  try {
    const { connection } = await context();
    if (connection) await revokeGoogleCalendarConnection(connection);
    return Response.json({
      message:
        "Google Calendar disconnected and its stored tokens were removed.",
    });
  } catch (error) {
    return errorResponse(error, "Unable to disconnect Google Calendar.");
  }
}
