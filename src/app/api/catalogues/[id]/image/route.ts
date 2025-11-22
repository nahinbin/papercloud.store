import { NextResponse } from "next/server";
import { getCatalogueById } from "@/lib/catalogueDb";

export const revalidate = 3600; // Revalidate every hour

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const catalogue = await getCatalogueById(id);

  if (!catalogue || !catalogue.imageData || !catalogue.imageMimeType) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(catalogue.imageData), {
    headers: {
      "Content-Type": catalogue.imageMimeType,
      "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year (images don't change)
      "X-Content-Type-Options": "nosniff",
    },
  });
}

