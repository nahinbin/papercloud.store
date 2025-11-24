import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { getUserPermissions } from "@/lib/permissions";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ user: null, permissions: [] }, { status: 401 });
    }
    
    // Get user permissions in parallel with user data
    const permissions = await getUserPermissions(user);
    
    return NextResponse.json({ user, permissions });
  } catch (error) {
    // Handle any errors gracefully
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null, permissions: [] }, { status: 500 });
  }
}


