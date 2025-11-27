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

  // Invalidate any previous tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  return prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
}

export async function getValidPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}

export async function markPasswordResetTokenUsed(id: string) {
  await prisma.passwordResetToken.update({
    where: { id },
    data: {
      usedAt: new Date(),
    },
  });
}

