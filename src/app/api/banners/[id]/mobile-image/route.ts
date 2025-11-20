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

    // If banner has mobileImageData, return it
    if (banner.mobileImageData && banner.mobileImageMimeType) {
      const buffer = Buffer.from(banner.mobileImageData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": banner.mobileImageMimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Fallback to mobileImageUrl if no mobileImageData
    if (banner.mobileImageUrl) {
      return NextResponse.redirect(banner.mobileImageUrl);
    }

    return NextResponse.json({ error: "No mobile image found" }, { status: 404 });
  } catch (error: any) {
    console.error("Banner mobile image serve error:", error);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}

