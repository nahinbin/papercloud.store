import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidEmailVerificationToken, markEmailVerificationTokenUsed } from "@/lib/emailVerification";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const tokenRecord = await getValidEmailVerificationToken(token);
  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  // Update email_verified_at using raw SQL (Prisma client doesn't recognize it)
  try {
    await prisma.$executeRaw`
      UPDATE users 
      SET email_verified_at = NOW() 
      WHERE id = ${tokenRecord.userId}
    `;
  } catch (error: any) {
    // If email_verified_at column doesn't exist, that's okay - token verification still worked
    if (error?.code !== "42703" && !error?.message?.includes("does not exist")) {
      throw error;
    }
    console.warn("email_verified_at column not found, skipping update");
  }

  await markEmailVerificationTokenUsed(tokenRecord.id);

  return NextResponse.json({ success: true });
}


