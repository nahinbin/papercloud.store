import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";
import { getProductById } from "@/lib/productDb";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { error: "Unauthorized", status: 401, user: null };
  }
  
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return { error: "Forbidden", status: 403, user: null };
  }
  
  return { error: null, status: 200, user };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  
  if (!body || typeof body.title !== "string" || typeof body.price !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        title: body.title,
        price: body.price,
        description: body.description || null,
        imageUrl: body.imageUrl || null,
        category: body.category || null,
        brand: body.brand || null,
        sku: body.sku || null,
        stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : null,
        weight: body.weight !== undefined ? Number(body.weight) : null,
        dimensionsWidth: body.dimensionsWidth !== undefined ? Number(body.dimensionsWidth) : null,
        dimensionsHeight: body.dimensionsHeight !== undefined ? Number(body.dimensionsHeight) : null,
        dimensionsDepth: body.dimensionsDepth !== undefined ? Number(body.dimensionsDepth) : null,
        color: body.color || null,
        material: body.material || null,
        condition: body.condition || null,
        tags: body.tags || null,
        shippingCost: body.shippingCost !== undefined ? Number(body.shippingCost) : null,
        estimatedShippingDays: body.estimatedShippingDays !== undefined ? Number(body.estimatedShippingDays) : null,
        returnPolicy: body.returnPolicy || null,
        warranty: body.warranty || null,
        specifications: body.specifications || null,
      },
    });

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        description: product.description ?? undefined,
        price: product.price,
        imageUrl: product.imageUrl ?? undefined,
        category: product.category ?? undefined,
        brand: product.brand ?? undefined,
        sku: product.sku ?? undefined,
        stockQuantity: product.stockQuantity ?? undefined,
        weight: product.weight ?? undefined,
        dimensionsWidth: product.dimensionsWidth ?? undefined,
        dimensionsHeight: product.dimensionsHeight ?? undefined,
        dimensionsDepth: product.dimensionsDepth ?? undefined,
        color: product.color ?? undefined,
        material: product.material ?? undefined,
        condition: product.condition ?? undefined,
        tags: product.tags ?? undefined,
        shippingCost: product.shippingCost ?? undefined,
        estimatedShippingDays: product.estimatedShippingDays ?? undefined,
        returnPolicy: product.returnPolicy ?? undefined,
        warranty: product.warranty ?? undefined,
        specifications: product.specifications ?? undefined,
        createdAt: product.createdAt.getTime(),
        updatedAt: product.updatedAt.getTime(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update product" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete product" }, { status: 400 });
  }
}

