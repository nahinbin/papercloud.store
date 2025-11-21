import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { createCatalogue, listCatalogues } from "@/lib/catalogueDb";

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
  const check = await ensureAdmin();
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const catalogues = await listCatalogues(false);
  return NextResponse.json({ catalogues });
}

export async function POST(request: Request) {
  const check = await ensureAdmin();
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status });
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

  return NextResponse.json({ catalogue }, { status: 201 });
}

