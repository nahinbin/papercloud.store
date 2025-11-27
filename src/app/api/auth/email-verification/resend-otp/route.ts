import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationOTP } from "@/lib/email";
import crypto from "crypto";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pendingId = typeof body?.pendingId === "string" ? body.pendingId.trim() : "";

  if (!pendingId) {
    return NextResponse.json({ error: "Missing pendingId" }, { status: 400 });
  }

  // Check if pendingRegistration model exists, if not use raw SQL
  const hasPendingRegistrationModel = typeof (prisma as any).pendingRegistration !== "undefined";
  
  let pending: { id: string; name: string | null; username: string; email: string } | null;
  
  if (!hasPendingRegistrationModel) {
    // Use raw SQL fallback
    const pendingRaw = await prisma.$queryRaw<Array<{
      id: string;
      name: string | null;
      username: string;
      email: string;
    }>>`
      SELECT id, name, username, email 
      FROM pending_registrations 
      WHERE id = ${pendingId}
    `;
    
    if (pendingRaw.length === 0) {
      return NextResponse.json({ error: "Pending registration not found" }, { status: 404 });
    }
    
    pending = {
      id: pendingRaw[0].id,
      name: pendingRaw[0].name,
      username: pendingRaw[0].username,
      email: pendingRaw[0].email,
    };
  } else {
    // Get pending registration using Prisma model
    pending = await (prisma as any).pendingRegistration.findUnique({
      where: { id: pendingId },
    });
  }

  if (!pending) {
    return NextResponse.json({ error: "Pending registration not found" }, { status: 404 });
  }

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update pending registration with new OTP
  if (hasPendingRegistrationModel) {
    await (prisma as any).pendingRegistration.update({
      where: { id: pendingId },
      data: { otp, expiresAt },
    });
    
    // Update verification tokens
    await (prisma as any).emailVerificationToken.updateMany({
      where: { pendingRegistrationId: pendingId },
      data: { otp, expiresAt, usedAt: null },
    });
  } else {
    // Use raw SQL
    await prisma.$executeRaw`
      UPDATE pending_registrations 
      SET otp = ${otp}, expires_at = ${expiresAt}
      WHERE id = ${pendingId}
    `;
    
    await prisma.$executeRaw`
      UPDATE email_verification_tokens 
      SET otp = ${otp}, expires_at = ${expiresAt}, used_at = NULL
      WHERE pending_registration_id = ${pendingId}
    `;
  }

  // Send OTP email
  try {
    await sendEmailVerificationOTP({
      to: pending.email,
      name: pending.name ?? pending.username,
      otp,
      expiresAt,
    });
  } catch (error) {
    console.error("Failed to send verification email", error);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Verification code sent" });
}

