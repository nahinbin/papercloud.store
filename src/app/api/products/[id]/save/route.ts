import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already saved
    const existing = await prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Product already saved", saved: true });
    }

    // Save product
    await prisma.savedProduct.create({
      data: {
        userId: user.id,
        productId: id,
      },
    });

    return NextResponse.json({ message: "Product saved", saved: true });
  } catch (error: any) {
    console.error("Save product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.savedProduct.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId: id,
        },
      },
    });

    return NextResponse.json({ message: "Product removed from saved items" });
  } catch (error: any) {
    console.error("Unsave product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove product" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return NextResponse.json({ saved: false });
  }

  try {
    const saved = await prisma.savedProduct.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: id,
        },
      },
    });

    return NextResponse.json({ saved: !!saved });
  } catch (error: any) {
    return NextResponse.json({ saved: false });
  }
}

