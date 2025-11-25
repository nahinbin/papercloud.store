import { NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/authDb";

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

  try {
    const user = await createUser({ 
      name: typeof body.name === "string" ? body.name : undefined, 
      username: body.username, 
      password: body.password,
      email: typeof body.email === "string" ? body.email : undefined,
    });
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Registration failed" }, { status: 400 });
  }
}


