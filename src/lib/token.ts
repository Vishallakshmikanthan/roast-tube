import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function getAccessToken(req: NextRequest): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const secure = req.nextUrl.protocol === "https:";
  const salt = secure ? "__Secure-authjs.session-token" : "authjs.session-token";

  try {
    const t = await getToken({ req, secret, salt, secureCookie: secure });
    if (t?.accessToken) {
      return t.accessToken as string;
    }
  } catch {
    // Fall through to default resolution
  }

  try {
    const fallbackToken = await getToken({ req, secret });
    if (fallbackToken?.accessToken) {
      return fallbackToken.accessToken as string;
    }
  } catch {
    // Ignore error
  }

  return null;
}
