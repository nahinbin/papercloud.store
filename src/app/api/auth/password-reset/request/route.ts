import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      const tokenRecord = await createPasswordResetToken(user.id);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || new URL(request.url).origin;
      const resetUrl = `${baseUrl}/reset-password?token=${tokenRecord.token}`;

      await sendPasswordResetEmail({
        to: email,
        name: user.name ?? user.username ?? undefined,
        resetUrl,
        expiresAt: tokenRecord.expiresAt,
      });
    }
  } catch (error) {
    console.error("Password reset request failed", error);
  }

  // Always return success to avoid leaking which emails exist
  return NextResponse.json({ success: true });
}

