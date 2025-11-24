import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("orders.edit");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  // Validate status
  const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });

    return createSuccessResponse({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("orders.delete");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;

  try {
    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Delete order (OrderItems will be cascade deleted)
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("orders.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return createSuccessResponse({ order });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

