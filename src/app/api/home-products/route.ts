import { NextResponse } from "next/server";
import { listHomeProductsPage } from "@/lib/productDb";

const DEFAULT_LIMIT = 16;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;
  const parsedLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : DEFAULT_LIMIT;

  const page = await listHomeProductsPage(limit, cursor);
  const response = NextResponse.json(page);
  response.headers.set("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
  return response;
}

