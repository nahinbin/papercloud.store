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

  try {
    const savedProducts = await prisma.savedProduct.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            imageUrl: true,
            imageData: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const products = savedProducts.map((sp) => ({
      id: sp.product.id,
      title: sp.product.title,
      price: sp.product.price,
      // Use image URL endpoint if imageData exists, otherwise use imageUrl
      imageUrl: sp.product.imageData ? `/api/products/${sp.product.id}/image` : (sp.product.imageUrl || null),
      stockQuantity: sp.product.stockQuantity,
    }));

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("Get saved products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get saved products" },
      { status: 500 }
    );
  }
}

