import { NextResponse } from "next/server";
import { getBannerById } from "@/lib/bannerDb";

export const revalidate = 60; // Revalidate every 60 seconds

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
    const response = NextResponse.json({ banner });
    // Add caching headers
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching banner:", error);
    return NextResponse.json({ error: "Banner not found" }, { status: 404 });
  }
}

