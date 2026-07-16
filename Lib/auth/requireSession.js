import { getServerSession } from "next-auth";
import { authOptions } from "./nextauth-options";

export async function requireSession(allowedRoles = []) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }
  if (allowedRoles.length && !allowedRoles.includes(session.user.role)) {
    const error = new Error(
      "You do not have permission to perform this action.",
    );
    error.status = 403;
    throw error;
  }
  return session;
}

export function errorResponse(error, fallback = "Request failed.") {
  const status = Number(error?.status) || 500;
  const message = status >= 500 ? fallback : error.message;
  return Response.json({ message }, { status });
}
