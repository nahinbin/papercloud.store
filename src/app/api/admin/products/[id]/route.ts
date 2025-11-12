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
      },
    });

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        description: product.description ?? undefined,
        price: product.price,
        imageUrl: product.imageUrl ?? undefined,
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

