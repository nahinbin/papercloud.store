import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { deleteCatalogue, getCatalogueById, updateCatalogue } from "@/lib/catalogueDb";

async function ensureAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return { error: "Forbidden", status: 403 };
  }

  return { error: null, status: 200 };
}

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
  const check = await ensureAdmin();
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
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

  return NextResponse.json({ catalogue });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const check = await ensureAdmin();
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { id } = await context.params;
  const catalogue = await getCatalogueById(id);
  if (!catalogue) {
    return NextResponse.json({ error: "Catalogue not found" }, { status: 404 });
  }

  await deleteCatalogue(id);
  return NextResponse.json({ success: true });
}

