import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const auth = await requirePermission("products.edit");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.orders)) {
    return NextResponse.json({ error: "Invalid payload. Expected { orders: Array<{ id: string, order: number }> }" }, { status: 400 });
  }

  // Update all products with new order values
  const updates = await Promise.all(
    body.orders.map((item: { id: string; order: number }) =>
      prisma.product.update({
        where: { id: item.id },
        data: { order: Number(item.order) },
      })
    )
  );

  return createSuccessResponse({ products: updates });
}

