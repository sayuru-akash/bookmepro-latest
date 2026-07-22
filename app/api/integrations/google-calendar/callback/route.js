import { NextResponse } from "next/server";
import { requireSession } from "../../../../../Lib/auth/requireSession";
import { verifyState } from "../../../../../Lib/security/secretBox";
import {
  ensureGoogleCalendarWatch,
  exchangeGoogleCalendarCode,
  listGoogleCalendars,
  saveGoogleCalendarConnection,
  syncGoogleDestinationCalendar,
} from "../../../../../Lib/integrations/googleCalendar";
import {
  drainCalendarOutbox,
  enqueueFutureCoachAppointments,
} from "../../../../../Lib/integrations/calendarOutbox";

export const maxDuration = 60;

function destination(request, ownerType, result) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    new URL(request.url).origin;
  const path =
    ownerType === "student"
      ? "/student-dashboard/my-profile"
      : "/dashboard/my-settings";
  return new URL(`${path}?calendar=${encodeURIComponent(result)}`, base);
}

export async function GET(request) {
  const url = new URL(request.url);
  let ownerType = "coach";
  try {
    if (url.searchParams.get("error"))
      throw new Error("Google Calendar access was not granted.");
    const code = url.searchParams.get("code");
    const state = verifyState(url.searchParams.get("state"));
    ownerType = state.ownerType;
    const session = await requireSession(["coach", "student"]);
    if (
      !code ||
      session.user.id !== state.ownerId ||
      session.user.role !== ownerType
    ) {
      throw new Error(
        "The Google Calendar connection session is invalid or expired.",
      );
    }

    const tokens = await exchangeGoogleCalendarCode(code);
    const connection = await saveGoogleCalendarConnection({
      ownerType,
      ownerId: state.ownerId,
      tokens,
    });
    const calendars = await listGoogleCalendars(connection);
    const primary =
      calendars.find((calendar) => calendar.primary) || calendars[0];
    if (primary) {
      connection.busyCalendarIds = [primary.id];
      if (ownerType === "coach") connection.destinationCalendarId = primary.id;
      connection.calendarTimeZone =
        primary.timeZone || connection.calendarTimeZone;
      await connection.save();
    }
    if (ownerType === "coach") {
      await syncGoogleDestinationCalendar(connection);
      await ensureGoogleCalendarWatch(connection);
      await enqueueFutureCoachAppointments(connection.ownerId, 500, {
        force: true,
      });
      await drainCalendarOutbox({ limit: 100 });
    }
    return NextResponse.redirect(destination(request, ownerType, "connected"));
  } catch (error) {
    console.error("Google Calendar callback failed:", error);
    return NextResponse.redirect(
      destination(request, ownerType, "connection_failed"),
    );
  }
}
