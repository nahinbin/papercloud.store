"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_BYTES = 32;
const DEFAULT_TTL_MINUTES = 60;

function getExpiryDate(): Date {
  const ttlMinutes = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? DEFAULT_TTL_MINUTES);
  const ttl = Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : DEFAULT_TTL_MINUTES;
  return new Date(Date.now() + ttl * 60 * 1000);
}

export async function createPasswordResetToken(userId: string) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const expiresAt = getExpiryDate();

  // Check if passwordResetToken model exists
  const hasPasswordResetTokenModel = typeof (prisma as any).passwordResetToken !== "undefined";

  if (!hasPasswordResetTokenModel) {
    // Use raw SQL fallback
    // First, ensure the table exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
          "id" TEXT NOT NULL,
          "user_id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires_at" TIMESTAMP(3) NOT NULL,
          "used_at" TIMESTAMP(3),
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
        )
      `);
      
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at")`);
      
      // Add foreign key if it doesn't exist
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'password_reset_tokens_user_id_fkey') THEN
              ALTER TABLE "password_reset_tokens" 
              ADD CONSTRAINT "password_reset_tokens_user_id_fkey" 
              FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
            END IF;
          END $$
        `);
      } catch (fkError: any) {
        // Foreign key might already exist, that's okay
        console.warn("Foreign key creation warning:", fkError?.message);
      }
    } catch (tableError: any) {
      // Table might already exist, that's okay
      console.warn("Table creation warning:", tableError?.message);
    }

    // Invalidate any previous tokens for this user
    await prisma.$executeRaw`
      UPDATE password_reset_tokens 
      SET used_at = NOW() 
      WHERE user_id = ${userId} AND used_at IS NULL
    `;

    // Create new token
    const tokenId = `cm${Date.now().toString(36)}${crypto.randomBytes(8).toString("hex")}`.substring(0, 25);
    await prisma.$executeRaw`
      INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
      VALUES (${tokenId}, ${userId}, ${token}, ${expiresAt}, NOW())
    `;

    // Return token record
    const tokenRecord = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>>`
      SELECT id, user_id as "userId", token, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
      FROM password_reset_tokens
      WHERE id = ${tokenId}
    `;

    if (tokenRecord.length === 0) {
      throw new Error("Failed to create password reset token");
    }

    return {
      id: tokenRecord[0].id,
      userId: tokenRecord[0].userId,
      token: tokenRecord[0].token,
      expiresAt: tokenRecord[0].expiresAt,
      usedAt: tokenRecord[0].usedAt,
      createdAt: tokenRecord[0].createdAt,
    };
  } else {
    // Use Prisma model
    // Invalidate any previous tokens for this user
    await (prisma as any).passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    return (prisma as any).passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}

export async function getValidPasswordResetToken(token: string) {
  const hasPasswordResetTokenModel = typeof (prisma as any).passwordResetToken !== "undefined";

  if (!hasPasswordResetTokenModel) {
    // Use raw SQL fallback
    const tokenRecord = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
      usedAt: Date | null;
      createdAt: Date;
    }>>`
      SELECT id, user_id as "userId", token, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
      FROM password_reset_tokens
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
      expiresAt: tokenRecord[0].expiresAt,
      usedAt: tokenRecord[0].usedAt,
      createdAt: tokenRecord[0].createdAt,
    };
  } else {
    return (prisma as any).passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }
}

export async function markPasswordResetTokenUsed(id: string) {
  const hasPasswordResetTokenModel = typeof (prisma as any).passwordResetToken !== "undefined";

  if (!hasPasswordResetTokenModel) {
    // Use raw SQL fallback
    await prisma.$executeRaw`
      UPDATE password_reset_tokens 
      SET used_at = NOW() 
      WHERE id = ${id}
    `;
  } else {
    await (prisma as any).passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }
}

