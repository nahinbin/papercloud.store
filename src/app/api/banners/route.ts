import { NextResponse } from "next/server";
import { listBanners } from "@/lib/bannerDb";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const banners = await listBanners(true); // Only return active banners for public API
  const response = NextResponse.json({ banners });
  // Add caching headers
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=120"
  );
  return response;
}

