import { NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  requireSession,
  errorResponse,
} from "../../../../../Lib/auth/requireSession";
import { googleCalendarAuthUrl } from "../../../../../Lib/integrations/googleCalendar";
import { signState } from "../../../../../Lib/security/secretBox";

export async function GET(request) {
  try {
    const session = await requireSession(["coach", "student"]);
    const requestedType = new URL(request.url).searchParams.get("ownerType");
    const ownerType = session.user.role === "student" ? "student" : "coach";
    if (requestedType && requestedType !== ownerType) {
      return Response.json(
        { message: "The requested calendar owner is invalid." },
        { status: 403 },
      );
    }
    const state = signState({
      ownerType,
      ownerId: session.user.id,
      nonce: crypto.randomUUID(),
    });
    return NextResponse.redirect(googleCalendarAuthUrl({ ownerType, state }));
  } catch (error) {
    return errorResponse(error, "Unable to start Google Calendar connection.");
  }
}
