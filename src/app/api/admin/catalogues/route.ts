import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { createCatalogue, listCatalogues } from "@/lib/catalogueDb";

function parseImagePayload(imageData: any, imageMimeType?: string) {
  if (!imageData) {
    return { data: undefined, mimeType: undefined };
  }

  if (typeof imageData === "string" && imageData.startsWith("data:")) {
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      return {
        data: Buffer.from(matches[2], "base64"),
        mimeType: matches[1],
      };
    }
  }

  if (typeof imageData === "string" && imageMimeType) {
    return { data: Buffer.from(imageData, "base64"), mimeType: imageMimeType };
  }

  return { data: undefined, mimeType: undefined };
}

export async function GET() {
  const auth = await requirePermission("catalogues.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const catalogues = await listCatalogues(false);
  return createSuccessResponse({ catalogues });
}

export async function POST(request: Request) {
  const auth = await requirePermission("catalogues.create");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const imagePayload = parseImagePayload(body.imageData, body.imageMimeType);

  const productIds = Array.isArray(body.productIds)
    ? (body.productIds.filter((id: unknown) => typeof id === "string") as string[])
    : [];

  const catalogue = await createCatalogue({
    title: body.title,
    slug: body.slug || undefined,
    description: body.description || undefined,
    content: body.content || undefined,
    imageUrl: body.imageUrl || undefined,
    imageData: imagePayload.data,
    imageMimeType: imagePayload.mimeType,
    linkUrl: body.linkUrl || undefined,
    order: body.order !== undefined ? Number(body.order) : 0,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    productIds,
  });

  return createSuccessResponse({ catalogue }, 201);
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("catalogues.edit");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.orders)) {
    return NextResponse.json({ error: "Invalid payload. Expected { orders: Array<{ id: string, order: number }> }" }, { status: 400 });
  }

  const { updateCatalogue } = await import("@/lib/catalogueDb");
  
  // Update all catalogues with new order values
  const updates = await Promise.all(
    body.orders.map((item: { id: string; order: number }) =>
      updateCatalogue(item.id, { order: Number(item.order) })
    )
  );

  return createSuccessResponse({ catalogues: updates });
}

