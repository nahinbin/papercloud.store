import { NextResponse } from "next/server";
import { getBannerById } from "@/lib/bannerDb";

export const revalidate = 3600; // Revalidate every hour

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

    // If banner has desktopImageData, return it
    if (banner.desktopImageData && banner.desktopImageMimeType) {
      const buffer = Buffer.from(banner.desktopImageData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": banner.desktopImageMimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // Fallback to desktopImageUrl if no desktopImageData
    if (banner.desktopImageUrl) {
      return NextResponse.redirect(banner.desktopImageUrl);
    }

    return NextResponse.json({ error: "No desktop image found" }, { status: 404 });
  } catch (error: any) {
    console.error("Banner desktop image serve error:", error);
    return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
  }
}

