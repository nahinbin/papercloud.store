import { NextResponse } from "next/server";
import { getBannerById } from "@/lib/bannerDb";

export const revalidate = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await getBannerById(id);
    
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // If banner has imageData, return it
    if (banner.imageData && banner.imageMimeType) {
      const buffer = Buffer.from(banner.imageData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": banner.imageMimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Fallback to imageUrl if no imageData
    if (banner.imageUrl) {
      return NextResponse.redirect(banner.imageUrl);
    }

    return NextResponse.json({ error: "No image found" }, { status: 404 });
  } catch (error: any) {
    console.error("Banner image serve error:", error);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}

