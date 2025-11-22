import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    // Handle any errors gracefully
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}


