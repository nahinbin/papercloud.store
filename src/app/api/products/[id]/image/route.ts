import { NextResponse } from "next/server";
import { getProductById } from "@/lib/productDb";

export const revalidate = 3600; // Revalidate every hour (images don't change often)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If product has imageData, return it
    if (product.imageData && product.imageMimeType) {
      const buffer = Buffer.from(product.imageData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": product.imageMimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Fallback to imageUrl if no imageData
    if (product.imageUrl) {
      try {
        const redirectUrl = new URL(product.imageUrl, request.url);
        return NextResponse.redirect(redirectUrl.toString());
      } catch (error) {
        console.error("Invalid product.imageUrl:", product.imageUrl, error);
      }
    }

    return NextResponse.json({ error: "No image found" }, { status: 404 });
  } catch (error: any) {
    console.error("Image serve error:", error);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}

