import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "./auth";
import { SessionUser } from "./types";

const COOKIE_NAME = "gh_session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function setSession(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = cookies();
  const isHttps =
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  const isHttps =
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL);
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

