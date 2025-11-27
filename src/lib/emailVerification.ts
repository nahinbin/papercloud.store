"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
const OTP_LENGTH = 6;
const DEFAULT_TTL_MINUTES = 10; // 10 minutes for OTP

function getExpiryDate(): Date {
  const ttlMinutes = Number(process.env.EMAIL_VERIFICATION_OTP_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  const ttl = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : DEFAULT_TTL_MINUTES;
  return new Date(Date.now() + ttl * 60 * 1000);
}

function generateOTP(): string {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createEmailVerificationToken(userId: string) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const otp = generateOTP();
  const expiresAt = getExpiryDate();

  const hasEmailVerificationTokenModel = typeof (prisma as any).emailVerificationToken !== "undefined";

  if (!hasEmailVerificationTokenModel) {
    // Use raw SQL fallback
    // Invalidate previous unused tokens
    try {
      await prisma.$executeRaw`
        UPDATE email_verification_tokens 
        SET used_at = NOW() 
        WHERE user_id = ${userId} AND used_at IS NULL
      `;
    } catch (error) {
      // Table might not exist, that's okay
      console.warn("Failed to invalidate previous tokens:", error);
    }

    // Create new token
    const tokenId = `cm${Date.now().toString(36)}${crypto.randomBytes(8).toString("hex")}`.substring(0, 25);
    await prisma.$executeRaw`
      INSERT INTO email_verification_tokens (id, user_id, token, otp, expires_at, created_at)
      VALUES (${tokenId}, ${userId}, ${token}, ${otp}, ${expiresAt}, NOW())
    `;

    const tokenRecord = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      token: string;
      otp: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>>`
      SELECT id, user_id as "userId", token, otp, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
      FROM email_verification_tokens
      WHERE id = ${tokenId}
    `;

    if (tokenRecord.length === 0) {
      throw new Error("Failed to create email verification token");
    }

    return {
      id: tokenRecord[0].id,
      userId: tokenRecord[0].userId,
      token: tokenRecord[0].token,
      otp: tokenRecord[0].otp,
      expiresAt: tokenRecord[0].expiresAt,
      usedAt: tokenRecord[0].usedAt,
      createdAt: tokenRecord[0].createdAt,
    };
  } else {
    // Use Prisma model
    // Invalidate previous unused tokens (if any exist)
    try {
      await (prisma as any).emailVerificationToken.updateMany({
        where: {
          userId,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });
    } catch (error) {
      // If table doesn't exist or other error, continue anyway
      console.warn("Failed to invalidate previous tokens:", error);
    }

    return (prisma as any).emailVerificationToken.create({
      data: {
        userId,
        token,
        otp,
        expiresAt,
      },
    });
  }
}

export async function getValidEmailVerificationToken(token: string) {
  const hasEmailVerificationTokenModel = typeof (prisma as any).emailVerificationToken !== "undefined";

  if (!hasEmailVerificationTokenModel) {
    // Use raw SQL fallback
    const tokenRecord = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      token: string;
      otp: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>>`
      SELECT id, user_id as "userId", token, otp, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
      FROM email_verification_tokens
      WHERE token = ${token} 
        AND used_at IS NULL 
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (tokenRecord.length === 0) {
      return null;
    }

    return {
      id: tokenRecord[0].id,
      userId: tokenRecord[0].userId,
      token: tokenRecord[0].token,
      otp: tokenRecord[0].otp,
      expiresAt: tokenRecord[0].expiresAt,
      usedAt: tokenRecord[0].usedAt,
      createdAt: tokenRecord[0].createdAt,
    };
  } else {
    return (prisma as any).emailVerificationToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}

export async function getValidEmailVerificationOTP(userId: string, otp: string) {
  const hasEmailVerificationTokenModel = typeof (prisma as any).emailVerificationToken !== "undefined";

  if (!hasEmailVerificationTokenModel) {
    // Use raw SQL fallback
    const tokenRecord = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      token: string;
      otp: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>>`
      SELECT id, user_id as "userId", token, otp, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
      FROM email_verification_tokens
      WHERE user_id = ${userId} 
        AND otp = ${otp}
        AND used_at IS NULL 
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (tokenRecord.length === 0) {
      return null;
    }

    return {
      id: tokenRecord[0].id,
      userId: tokenRecord[0].userId,
      token: tokenRecord[0].token,
      otp: tokenRecord[0].otp,
      expiresAt: tokenRecord[0].expiresAt,
      usedAt: tokenRecord[0].usedAt,
      createdAt: tokenRecord[0].createdAt,
    };
  } else {
    return (prisma as any).emailVerificationToken.findFirst({
      where: {
        userId,
        otp,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}

export async function getValidEmailVerificationOTPByPendingId(pendingId: string, otp: string) {
  const hasEmailVerificationTokenModel = typeof (prisma as any).emailVerificationToken !== "undefined";

  if (!hasEmailVerificationTokenModel) {
    // Use raw SQL fallback
    const tokenRecord = await prisma.$queryRaw<Array<{
      id: string;
      pendingRegistrationId: string;
      token: string;
      otp: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>>`
      SELECT id, pending_registration_id as "pendingRegistrationId", token, otp, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
      FROM email_verification_tokens
      WHERE pending_registration_id = ${pendingId} 
        AND otp = ${otp}
        AND used_at IS NULL 
        AND expires_at > NOW()
      LIMIT 1
    `;

    if (tokenRecord.length === 0) {
      return null;
    }

    return {
      id: tokenRecord[0].id,
      pendingRegistrationId: tokenRecord[0].pendingRegistrationId,
      token: tokenRecord[0].token,
      otp: tokenRecord[0].otp,
      expiresAt: tokenRecord[0].expiresAt,
      usedAt: tokenRecord[0].usedAt,
      createdAt: tokenRecord[0].createdAt,
    };
  } else {
    return (prisma as any).emailVerificationToken.findFirst({
      where: {
        pendingRegistrationId: pendingId,
        otp,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}

export async function markEmailVerificationTokenUsed(id: string) {
  const hasEmailVerificationTokenModel = typeof (prisma as any).emailVerificationToken !== "undefined";

  if (!hasEmailVerificationTokenModel) {
    // Use raw SQL fallback
    await prisma.$executeRaw`
      UPDATE email_verification_tokens 
      SET used_at = NOW() 
      WHERE id = ${id}
    `;
  } else {
    await (prisma as any).emailVerificationToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }
}


