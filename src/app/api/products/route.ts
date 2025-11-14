import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createProduct, listProducts } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const products = await listProducts();
  const response = NextResponse.json({ products });
  // Add caching headers
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=120"
  );
  return response;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Check if admin by isAdmin flag OR username is @admin or admin
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admins can create products" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || typeof body.price !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const product = await createProduct({
    title: body.title,
    price: body.price,
    description: body.description || undefined,
    imageUrl: body.imageUrl || undefined,
    category: body.category || undefined,
    brand: body.brand || undefined,
    sku: body.sku || undefined,
    stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : undefined,
    weight: body.weight !== undefined ? Number(body.weight) : undefined,
    dimensionsWidth: body.dimensionsWidth !== undefined ? Number(body.dimensionsWidth) : undefined,
    dimensionsHeight: body.dimensionsHeight !== undefined ? Number(body.dimensionsHeight) : undefined,
    dimensionsDepth: body.dimensionsDepth !== undefined ? Number(body.dimensionsDepth) : undefined,
    color: body.color || undefined,
    material: body.material || undefined,
    condition: body.condition || undefined,
    tags: body.tags || undefined,
    shippingCost: body.shippingCost !== undefined ? Number(body.shippingCost) : undefined,
    estimatedShippingDays: body.estimatedShippingDays !== undefined ? Number(body.estimatedShippingDays) : undefined,
    returnPolicy: body.returnPolicy || undefined,
    warranty: body.warranty || undefined,
    specifications: body.specifications || undefined,
  });
  return NextResponse.json({ id: product.id, product }, { status: 201 });
}