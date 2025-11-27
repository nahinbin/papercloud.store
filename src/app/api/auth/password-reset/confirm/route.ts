import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidPasswordResetToken, markPasswordResetTokenUsed } from "@/lib/passwordReset";
import { hashPassword } from "@/lib/authDb";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Token and a password of at least 8 characters are required" },
      { status: 400 },
    );
  }

  const tokenRecord = await getValidPasswordResetToken(token);
  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: tokenRecord.userId },
    data: {
      passwordHash: hashPassword(password),
    },
  });

  await markPasswordResetTokenUsed(tokenRecord.id);

  return NextResponse.json({ success: true });
}

