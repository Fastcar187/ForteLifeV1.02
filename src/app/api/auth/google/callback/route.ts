import { NextRequest, NextResponse } from "next/server";
import { getDataStore } from "@/lib/data-store";
import { setSession } from "@/lib/session";
import { SessionUser } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const loginUrl = new URL("/auth/login", request.url);

  if (errorParam) {
    loginUrl.searchParams.set("error", `Google sign-in was cancelled: ${errorParam}`);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "Missing Google authorization code");
    return NextResponse.redirect(loginUrl);
  }

  // Verify CSRF state token
  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    loginUrl.searchParams.set("error", "Invalid OAuth state token. Please try signing in again.");
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "Google OAuth credentials not configured on server.");
    return NextResponse.redirect(loginUrl);
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("Google token exchange failed:", errBody);
      loginUrl.searchParams.set("error", "Failed to exchange Google token. Please try again.");
      return NextResponse.redirect(loginUrl);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // 2. Fetch User Profile from Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userinfoResponse.ok) {
      loginUrl.searchParams.set("error", "Failed to retrieve Google user profile");
      return NextResponse.redirect(loginUrl);
    }

    const profile = await userinfoResponse.json();
    const email = profile.email;
    const name = profile.name || profile.given_name || "Patient";

    if (!email) {
      loginUrl.searchParams.set("error", "Google account does not provide an email address.");
      return NextResponse.redirect(loginUrl);
    }

    // 3. Find or register patient in data store
    const store = getDataStore();
    const { user, fullName } = store.findOrCreateGoogleUser({
      email,
      fullName: name,
    });

    // 4. Create and set session
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName,
      isMfaEnrolled: true,
    };

    await setSession(sessionUser);
    store.recordAudit("USER_LOGIN_OAUTH", "users", user.id, sessionUser, {
      provider: "google",
      email,
    });

    // 5. Clear state cookie and redirect to appropriate portal
    const targetUrl = new URL(
      user.role === "patient" ? "/patient/dashboard" : "/",
      request.url
    );

    const response = NextResponse.redirect(targetUrl);
    response.cookies.delete("oauth_state");
    return response;
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    loginUrl.searchParams.set("error", "An unexpected error occurred during Google sign-in.");
    return NextResponse.redirect(loginUrl);
  }
}

