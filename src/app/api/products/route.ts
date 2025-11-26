import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createProduct, listProducts } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  const isAdmin = user && (user.isAdmin || user.username === "@admin" || user.username === "admin");
  
  // For admins, include drafts; for public, exclude drafts
  let products;
  if (isAdmin) {
    products = await listProducts(true); // Include drafts for admins
  } else {
    products = await listProducts(false); // Exclude drafts for public
  }
  
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
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  
  // Handle image data - convert base64 data URL to buffer if provided
  let imageData: Uint8Array | undefined = undefined;
  let imageMimeType: string | undefined = undefined;
  
  if (body.imageData) {
    // If it's a base64 data URL (data:image/...;base64,...)
    if (typeof body.imageData === 'string' && body.imageData.startsWith('data:')) {
      const matches = body.imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        imageMimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
      }
    } else if (body.imageData && body.imageMimeType) {
      // If it's already a base64 string without data URL prefix
      const buffer = Buffer.from(body.imageData, 'base64');
      imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
      imageMimeType = body.imageMimeType;
    }
  }
  
  const product = await createProduct({
    title: body.title || "",
    price: body.price !== undefined && body.price !== null ? Number(body.price) : 0,
    description: body.description || undefined,
    imageUrl: body.imageUrl || undefined,
    imageData: imageData,
    imageMimeType: imageMimeType,
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
    tags: body.tags || undefined,
    shippingCost: body.shippingCost !== undefined ? Number(body.shippingCost) : undefined,
    estimatedShippingDays: body.estimatedShippingDays !== undefined ? Number(body.estimatedShippingDays) : undefined,
    returnPolicy: body.returnPolicy || undefined,
    warranty: body.warranty || undefined,
    specifications: body.specifications || undefined,
    isDraft: body.isDraft ?? false,
  });

  // Assign product to catalogues if catalogueIds are provided
  if (body.catalogueIds && Array.isArray(body.catalogueIds) && body.catalogueIds.length > 0) {
    try {
      await (prisma as any).catalogueProduct.createMany({
        data: body.catalogueIds.map((catalogueId: string) => ({
          catalogueId,
          productId: product.id!,
        })),
        skipDuplicates: true,
      });
    } catch (error: any) {
      console.error("Error assigning product to catalogues:", error);
      // Don't fail the request if catalogue assignment fails, product is already created
    }
  }

  return NextResponse.json({ id: product.id, product }, { status: 201 });
}