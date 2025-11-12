import { NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/authDb";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const user = await createUser({ name: typeof body.name === "string" ? body.name : undefined, email: body.email, password: body.password });
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


