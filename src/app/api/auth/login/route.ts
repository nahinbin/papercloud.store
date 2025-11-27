import { NextResponse } from "next/server";
import { createSession, verifyUser } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

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

  // Check if email is verified (get from database directly using raw SQL)
  let emailVerifiedAt: Date | null = null;
  let userEmail: string | null = null;
  
  try {
    const emailVerificationResult = await prisma.$queryRaw<Array<{ 
      email: string | null; 
      email_verified_at: Date | null 
    }>>`
      SELECT email, email_verified_at 
      FROM users 
      WHERE id = ${user.id}
    `;
    
    if (emailVerificationResult.length > 0) {
      userEmail = emailVerificationResult[0].email;
      emailVerifiedAt = emailVerificationResult[0].email_verified_at;
    }
  } catch (error: any) {
    // If email_verified_at column doesn't exist, try without it
    if (error?.code === "42703" || error?.message?.includes("does not exist")) {
      const userResult = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          email: true,
        },
      });
      userEmail = userResult?.email || null;
      // If column doesn't exist, assume email is verified (for backward compatibility)
      emailVerifiedAt = new Date();
    } else {
      throw error;
    }
  }

  if (userEmail && !emailVerifiedAt) {
    // Email not verified - return error
    return NextResponse.json({ 
      error: "Email verification required. Please check your email for the verification code.",
      emailVerificationRequired: true,
      userId: user.id,
      email: userEmail,
    }, { status: 403 });
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


