import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admins can save drafts" }, { status: 403 });
  }
  
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Handle image data
    let imageData: Uint8Array | undefined = undefined;
    let imageMimeType: string | undefined = undefined;
    
    if (body.imageData) {
      if (typeof body.imageData === 'string' && body.imageData.startsWith('data:')) {
        const matches = body.imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          imageMimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
        }
      } else if (body.imageData && body.imageMimeType) {
        const buffer = Buffer.from(body.imageData, 'base64');
        imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
        imageMimeType = body.imageMimeType;
      }
    }

    // Check if draft already exists
    const existingDraft = body.draftId 
      ? await prisma.product.findUnique({ where: { id: body.draftId } })
      : null;

    let product;
    if (existingDraft && existingDraft.isDraft) {
      // Update existing draft
      product = await prisma.product.update({
        where: { id: body.draftId },
        data: {
          title: body.title || "",
          price: body.price !== undefined && body.price !== null ? Number(body.price) : 0,
          description: body.description || null,
          imageUrl: body.imageUrl || null,
          imageData: imageData ? (imageData as any) : undefined,
          imageMimeType: imageMimeType || null,
          category: body.category || null,
          brand: body.brand || null,
          sku: body.sku || null,
          stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : null,
          color: body.color || null,
          tags: body.tags || null,
          specifications: body.specifications || null,
          isDraft: true,
        },
      });
    } else {
      // Create new draft
      product = await prisma.product.create({
        data: {
          title: body.title || "",
          price: body.price !== undefined && body.price !== null ? Number(body.price) : 0,
          description: body.description || null,
          imageUrl: body.imageUrl || null,
          imageData: imageData ? (imageData as any) : null,
          imageMimeType: imageMimeType || null,
          category: body.category || null,
          brand: body.brand || null,
          sku: body.sku || null,
          stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : null,
          color: body.color || null,
          tags: body.tags || null,
          specifications: body.specifications || null,
          isDraft: true,
        },
      });
    }

    // Update catalogue assignments
    if (body.catalogueIds && Array.isArray(body.catalogueIds)) {
      try {
        // Remove existing catalogue assignments
        await (prisma as any).catalogueProduct.deleteMany({
          where: { productId: product.id },
        });

        // Add new catalogue assignments
        if (body.catalogueIds.length > 0) {
          await (prisma as any).catalogueProduct.createMany({
            data: body.catalogueIds.map((catalogueId: string) => ({
              catalogueId,
              productId: product.id,
            })),
            skipDuplicates: true,
          });
        }
      } catch (error: any) {
        console.error("Error updating draft catalogues:", error);
      }
    }

    return NextResponse.json({ 
      id: product.id, 
      product: {
        id: product.id,
        title: product.title,
        isDraft: product.isDraft,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error saving draft:", error);
    return NextResponse.json({ error: error?.message || "Failed to save draft" }, { status: 500 });
  }
}

