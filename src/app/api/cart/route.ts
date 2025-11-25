import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    if (!prisma.cart) {
      console.error("Cart model not available. Please restart the dev server to regenerate Prisma client.");
      return NextResponse.json({ items: [] });
    }

    // Get or create cart for user
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    const items = cart.items.map((item) => ({
      productId: item.productId,
      title: item.productTitle,
      price: item.productPrice,
      imageUrl: item.imageUrl ?? undefined,
      quantity: item.quantity,
      stockQuantity: item.stockQuantity ?? undefined,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma.cart) {
      console.error("Cart model not available. Please restart the dev server to regenerate Prisma client.");
      return NextResponse.json({ error: "Cart service unavailable. Please restart the server." }, { status: 503 });
    }

    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items array" }, { status: 400 });
    }

    // Validate stock quantities against actual product stock
    const stockValidationErrors: string[] = [];
    const productIds = items.map((item: any) => item.productId).filter(Boolean);
    
    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, title: true, stockQuantity: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          stockValidationErrors.push(`Product "${item.title || item.productId}" no longer exists`);
          continue;
        }

        // Validate quantity doesn't exceed stock
        if (product.stockQuantity !== null) {
          if (product.stockQuantity <= 0) {
            stockValidationErrors.push(`"${product.title}" is out of stock`);
          } else if (item.quantity > product.stockQuantity) {
            stockValidationErrors.push(
              `"${product.title}": Only ${product.stockQuantity} available, but ${item.quantity} requested`
            );
          }
        }
      }
    }

    if (stockValidationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Stock validation failed",
          stockErrors: stockValidationErrors,
        },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Get existing items
    const existingItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });

    const existingItemMap = new Map(existingItems.map((item) => [item.productId, item]));
    const incomingProductIds = new Set(items.map((item: any) => item.productId));

    // Get fresh product data to ensure stock quantities are up to date
    const products = await prisma.product.findMany({
      where: { id: { in: Array.from(incomingProductIds) } },
      select: { id: true, title: true, price: true, imageUrl: true, stockQuantity: true },
    });

    const productDataMap = new Map(products.map((p) => [p.id, p]));

    // Prepare operations
    const operations: Promise<any>[] = [];

    // Items to create (new products)
    const itemsToCreate = items
      .filter((item: any) => !existingItemMap.has(item.productId))
      .map((item: any) => {
        const product = productDataMap.get(item.productId);
        return {
          cartId: cart.id,
          productId: item.productId,
          productTitle: product?.title || item.title,
          productPrice: product?.price || item.price,
          imageUrl: product?.imageUrl || item.imageUrl || null,
          quantity: item.quantity,
          stockQuantity: product?.stockQuantity ?? item.stockQuantity ?? null,
        };
      });

    if (itemsToCreate.length > 0) {
      operations.push(prisma.cartItem.createMany({ data: itemsToCreate }));
    }

    // Items to update (existing products)
    items
      .filter((item: any) => existingItemMap.has(item.productId))
      .forEach((item: any) => {
        const existing = existingItemMap.get(item.productId)!;
        const product = productDataMap.get(item.productId);
        operations.push(
          prisma.cartItem.update({
            where: { id: existing.id },
            data: {
              productTitle: product?.title || item.title,
              productPrice: product?.price || item.price,
              imageUrl: product?.imageUrl || item.imageUrl || null,
              quantity: item.quantity,
              stockQuantity: product?.stockQuantity ?? item.stockQuantity ?? null,
            },
          })
        );
      });

    // Items to delete (removed from cart)
    existingItems
      .filter((item) => !incomingProductIds.has(item.productId))
      .forEach((item) => {
        operations.push(prisma.cartItem.delete({ where: { id: item.id } }));
      });

    // Execute all operations
    if (operations.length > 0) {
      await Promise.all(operations);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!prisma.cart) {
      console.error("Cart model not available. Please restart the dev server to regenerate Prisma client.");
      return NextResponse.json({ error: "Cart service unavailable. Please restart the server." }, { status: 503 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 });
  }
}
