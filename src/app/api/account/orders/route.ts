import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const response = NextResponse.json({ orders });
  // Cache for 10 seconds (orders can change)
  response.headers.set("Cache-Control", "private, s-maxage=10, stale-while-revalidate=30");
  return response;
}

