import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createProduct, listProducts } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Check if admin by isAdmin flag OR username is @admin
  const isAdmin = user.isAdmin || user.username === "@admin";
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
  });
  return NextResponse.json({ id: product.id, product }, { status: 201 });
}