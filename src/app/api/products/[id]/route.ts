import { NextResponse } from "next/server";
import { getProductById } from "@/lib/productDb";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const response = NextResponse.json({ product });
  // Add caching headers
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=120"
  );
  return response;
}

