import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requirePermission("orders.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const response = createSuccessResponse({ orders });
  // Cache for 10 seconds (orders change frequently)
  response.headers.set("Cache-Control", "private, s-maxage=10, stale-while-revalidate=30");
  return response;
}

