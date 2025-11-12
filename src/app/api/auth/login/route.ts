import { NextResponse } from "next/server";
import { createSession, verifyUser } from "@/lib/authDb";

// Username validation: only lowercase letters, numbers, and underscore
function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]+$/.test(username);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate username format on server side
  if (!isValidUsername(body.username)) {
    return NextResponse.json({ 
      error: "Username can only contain lowercase letters, numbers, and underscores" 
    }, { status: 400 });
  }

  const user = await verifyUser(body.username, body.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const token = await createSession(user.id);
  const res = NextResponse.json({ user });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}


