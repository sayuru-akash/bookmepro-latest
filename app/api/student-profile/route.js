import {
  errorResponse,
  requireSession,
} from "../../../Lib/auth/requireSession";

export async function PUT() {
  try {
    await requireSession(["student"]);
    return Response.json(
      { message: "Use the authenticated student profile endpoint." },
      { status: 410 },
    );
  } catch (error) {
    return errorResponse(error, "Unable to update the student profile.");
  }
}
