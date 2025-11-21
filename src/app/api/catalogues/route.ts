import { NextResponse } from "next/server";
import { listCatalogues } from "@/lib/catalogueDb";

export async function GET() {
  const catalogues = await listCatalogues(true);
  const response = NextResponse.json({ catalogues });
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return response;
}

