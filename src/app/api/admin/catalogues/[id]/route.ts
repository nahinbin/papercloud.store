import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { deleteCatalogue, getCatalogueById, updateCatalogue } from "@/lib/catalogueDb";

function parseImagePayload(imageData: any, imageMimeType?: string) {
  if (imageData === null) {
    return { data: null, mimeType: null };
  }

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("catalogues.edit");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id } = await context.params;
  const imagePayload = parseImagePayload(body.imageData, body.imageMimeType);

  const productIds = Array.isArray(body.productIds)
    ? (body.productIds.filter((pid: unknown) => typeof pid === "string") as string[])
    : undefined;

  const catalogue = await updateCatalogue(id, {
    title: body.title,
    slug: body.slug,
    description: body.description,
    content: body.content,
    imageUrl: body.imageUrl,
    imageData: imagePayload.data as any,
    imageMimeType: imagePayload.mimeType ?? undefined,
    linkUrl: body.linkUrl,
    order: body.order !== undefined ? Number(body.order) : undefined,
    isActive: body.isActive,
    productIds,
  });

  return createSuccessResponse({ catalogue });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("catalogues.delete");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await context.params;
  const catalogue = await getCatalogueById(id);
  if (!catalogue) {
    return NextResponse.json({ error: "Catalogue not found" }, { status: 404 });
  }

  await deleteCatalogue(id);
  return createSuccessResponse({ success: true });
}

