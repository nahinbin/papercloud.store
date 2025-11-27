import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/authDb";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pendingId = typeof body?.pendingId === "string" ? body.pendingId.trim() : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!pendingId || !otp) {
    return NextResponse.json({ error: "Missing pendingId or OTP" }, { status: 400 });
  }

  // Check if pendingRegistration model exists, if not use raw SQL
  const hasPendingRegistrationModel = typeof (prisma as any).pendingRegistration !== "undefined";
  
  let pending: { id: string; name: string | null; username: string; passwordHash: string; email: string; otp: string; expiresAt: Date } | null;
  
  if (!hasPendingRegistrationModel) {
    // Use raw SQL fallback
    const pendingRaw = await prisma.$queryRaw<Array<{
      id: string;
      name: string | null;
      username: string;
      password_hash: string;
      email: string;
      otp: string;
      expires_at: Date;
    }>>`
      SELECT id, name, username, password_hash, email, otp, expires_at 
      FROM pending_registrations 
      WHERE id = ${pendingId}
    `;
    
    if (pendingRaw.length === 0) {
      return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
    }
    
    pending = {
      id: pendingRaw[0].id,
      name: pendingRaw[0].name,
      username: pendingRaw[0].username,
      passwordHash: pendingRaw[0].password_hash,
      email: pendingRaw[0].email,
      otp: pendingRaw[0].otp,
      expiresAt: pendingRaw[0].expires_at,
    };
  } else {
    // Get pending registration using Prisma model
    pending = await (prisma as any).pendingRegistration.findUnique({
      where: { id: pendingId },
    });
  }

  if (!pending) {
    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
  }

  // Check if expired
  if (pending.expiresAt < new Date()) {
    if (hasPendingRegistrationModel) {
      await (prisma as any).pendingRegistration.delete({ where: { id: pendingId } });
    } else {
      await prisma.$executeRaw`DELETE FROM pending_registrations WHERE id = ${pendingId}`;
    }
    return NextResponse.json({ error: "Verification code has expired. Please register again." }, { status: 400 });
  }

  // Verify OTP
  if (pending.otp !== otp) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  // Check if username/email still available
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: pending.username },
        { email: pending.email },
      ],
    },
  });

  if (existingUser) {
    // Delete pending registration
    if (hasPendingRegistrationModel) {
      await (prisma as any).pendingRegistration.delete({ where: { id: pendingId } });
    } else {
      await prisma.$executeRaw`DELETE FROM pending_registrations WHERE id = ${pendingId}`;
    }
    return NextResponse.json({ error: "Username or email is already taken. Please register again." }, { status: 400 });
  }

  // CREATE THE USER ACCOUNT NOW (only after verification)
  // Use raw SQL to create user since Prisma client might not have emailVerifiedAt field
  const userId = `cm${Date.now().toString(36)}${crypto.randomBytes(8).toString("hex")}`.substring(0, 25);
  const isAdmin = pending.username === "@admin" || pending.username === "admin";
  const emailVerifiedAt = new Date();
  
  try {
    // Try with email_verified_at first
    await prisma.$executeRaw`
      INSERT INTO users (id, name, username, password_hash, email, email_verified_at, is_admin, created_at, updated_at)
      VALUES (${userId}, ${pending.name || null}, ${pending.username}, ${pending.passwordHash}, ${pending.email}, ${emailVerifiedAt}, ${isAdmin}, NOW(), NOW())
    `;
  } catch (createError: any) {
    // If email_verified_at column doesn't exist, try without it
    if (createError?.message?.includes("email_verified_at") || createError?.code === "42703") {
      console.warn("email_verified_at column not found, creating user without it");
      await prisma.$executeRaw`
        INSERT INTO users (id, name, username, password_hash, email, is_admin, created_at, updated_at)
        VALUES (${userId}, ${pending.name || null}, ${pending.username}, ${pending.passwordHash}, ${pending.email}, ${isAdmin}, NOW(), NOW())
      `;
    } else {
      throw createError;
    }
  }
  
  // Get the created user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }

  // Delete pending registration
  if (hasPendingRegistrationModel) {
    await (prisma as any).pendingRegistration.delete({ where: { id: pendingId } });
    // Mark verification tokens as used
    await (prisma as any).emailVerificationToken.updateMany({
      where: { pendingRegistrationId: pendingId },
      data: { usedAt: new Date() },
    });
  } else {
    // Use raw SQL
    await prisma.$executeRaw`DELETE FROM pending_registrations WHERE id = ${pendingId}`;
    await prisma.$executeRaw`
      UPDATE email_verification_tokens 
      SET used_at = NOW() 
      WHERE pending_registration_id = ${pendingId}
    `;
  }

  // Create session
  const token = await createSession(user.id);
  const res = NextResponse.json({ success: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}

