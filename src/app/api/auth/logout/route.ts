import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/authDb";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  await deleteSession(token ?? null);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}


