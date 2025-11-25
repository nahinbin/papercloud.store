import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { available: false, error: "Invalid email" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
  });

  return NextResponse.json({ available: !existing });
}

