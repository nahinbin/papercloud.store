import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Same validation rule as register route
function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]+$/.test(username);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username || !isValidUsername(username)) {
    return NextResponse.json(
      { available: false, error: "Invalid username" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  return NextResponse.json({ available: !existing });
}

