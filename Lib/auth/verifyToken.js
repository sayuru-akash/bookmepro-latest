import { getToken } from "next-auth/jwt";

export async function verifyTokenAndAuthorization(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return false;
  }
  return true;
}
