import { NextResponse } from "next/server";
import { getCatalogueById } from "@/lib/catalogueDb";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const catalogue = await getCatalogueById(id);

  if (!catalogue || !catalogue.imageData || !catalogue.imageMimeType) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(catalogue.imageData, {
    headers: {
      "Content-Type": catalogue.imageMimeType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}

