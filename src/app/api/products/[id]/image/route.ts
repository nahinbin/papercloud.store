import { NextResponse } from "next/server";
import { getProductById } from "@/lib/productDb";
import { prisma } from "@/lib/prisma";

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

    // If imageData is missing but specifications has a data URL, try to restore it
    if (!product.imageData && product.specifications) {
      try {
        const parsedSpecs = typeof product.specifications === 'string' 
          ? JSON.parse(product.specifications) 
          : product.specifications;
        if (Array.isArray(parsedSpecs) && parsedSpecs.length > 0) {
          const firstImage = parsedSpecs[0];
          if (firstImage?.url && typeof firstImage.url === 'string' && firstImage.url.startsWith('data:')) {
            // Extract image data from data URL in specifications
            const matches = firstImage.url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              
              // Restore imageData in database for future requests
              // Do this asynchronously so we don't block the response
              prisma.product.update({
                where: { id },
                data: {
                  imageData: buffer as any,
                  imageMimeType: mimeType,
                  imageUrl: null,
                },
              }).catch((err) => {
                console.error("Failed to restore imageData from specifications:", err);
              });
              
              // Return the image immediately
              return new NextResponse(buffer, {
                headers: {
                  "Content-Type": mimeType,
                  "Cache-Control": "public, max-age=31536000, immutable",
                  "X-Content-Type-Options": "nosniff",
                },
              });
            }
          }
        }
      } catch (e) {
        // If parsing fails, continue to fallback
        console.warn("Failed to restore image from specifications:", e);
      }
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

