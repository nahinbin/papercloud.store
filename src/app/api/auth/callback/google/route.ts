import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { createOrUpdateGoogleUser, createSession } from "@/lib/authDb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url.split('/api')[0];

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, baseUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Missing authorization code")}`, baseUrl)
      );
    }

    // Verify state token
    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Invalid state token")}`, baseUrl)
      );
    }

    // Clear state cookie
    cookieStore.delete("oauth_state");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/google`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Google OAuth not configured")}`, baseUrl)
      );
    }

    // Exchange code for tokens
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Failed to get ID token")}`, baseUrl)
      );
    }

    // Verify and get user info from Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Failed to verify Google token")}`, baseUrl)
      );
    }

    // Extract user information
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    if (!googleId || !email) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Missing required user information")}`, baseUrl)
      );
    }

    // Create or update user in database
    const user = await createOrUpdateGoogleUser({
      googleId,
      email,
      name: name || undefined,
      picture: picture || undefined,
    });

    // Create session
    const sessionToken = await createSession(user.id);

    // Redirect to home with session cookie
    const response = NextResponse.redirect(
      new URL("/", request.url)
    );

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Google OAuth callback error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url.split('/api')[0];
    const errorMessage = err.message || "Authentication failed";
    // Truncate error message if too long to avoid URL issues
    const shortError = errorMessage.length > 100 ? "Authentication failed" : errorMessage;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(shortError)}`, baseUrl)
    );
  }
}

