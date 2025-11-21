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
  
  // Check if admin
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get counts
  const [usersCount, productsCount, ordersCount] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  const response = NextResponse.json({
    stats: {
      users: usersCount,
      products: productsCount,
      orders: ordersCount,
    },
  });
  // Cache stats for 60 seconds
  response.headers.set("Cache-Control", "private, s-maxage=60, stale-while-revalidate=120");
  return response;
}

