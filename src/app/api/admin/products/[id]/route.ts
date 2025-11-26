import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { getProductById } from "@/lib/productDb";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("products.edit");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Get current product to check existing imageData
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      select: { imageData: true, imageMimeType: true, specifications: true },
    });

    // Handle image data - convert base64 data URL to buffer if provided
    let imageData: Uint8Array | null | undefined = undefined;
    let imageMimeType: string | null | undefined = undefined;
    let restoredFromSpecs = false;
    
    if (body.imageData) {
      // If it's a base64 data URL (data:image/...;base64,...)
      if (typeof body.imageData === 'string' && body.imageData.startsWith('data:')) {
        const matches = body.imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          imageMimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
        }
      } else if (body.imageData && body.imageMimeType) {
        // If it's already a base64 string without data URL prefix
        const buffer = Buffer.from(body.imageData, 'base64');
        imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
        imageMimeType = body.imageMimeType;
      }
    } else if (!body.imageUrl && body.specifications) {
      // If imageData is not provided but specifications has images, try to restore from specifications
      // This handles the case where imageData was lost but specifications still has the data URL
      try {
        const parsedSpecs = typeof body.specifications === 'string' 
          ? JSON.parse(body.specifications) 
          : body.specifications;
        if (Array.isArray(parsedSpecs) && parsedSpecs.length > 0) {
          const firstImage = parsedSpecs[0];
          if (firstImage?.url && typeof firstImage.url === 'string' && firstImage.url.startsWith('data:')) {
            // Extract image data from data URL in specifications
            const matches = firstImage.url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              imageMimeType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              imageData = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) as Uint8Array;
              restoredFromSpecs = true;
            }
          }
        }
      } catch (e) {
        // If parsing fails, ignore and continue
        console.warn("Failed to parse specifications for image restoration:", e);
      }
    }
    
    // Build update data object, only including fields that are provided
    const updateData: any = {};
    
    // Only set title and price if provided (use defaults if empty)
    if (body.title !== undefined) updateData.title = body.title || "";
    if (body.price !== undefined) updateData.price = body.price !== null && body.price !== "" ? Number(body.price) : 0;
    
    // Always update all fields that are in the request body (use null for empty values)
    // This ensures all fields are updated, not just the ones that changed
    if ('description' in body) updateData.description = body.description || null;
    if ('category' in body) updateData.category = body.category || null;
    if ('brand' in body) updateData.brand = body.brand || null;
    if ('sku' in body) updateData.sku = body.sku || null;
    if ('stockQuantity' in body) updateData.stockQuantity = body.stockQuantity !== null && body.stockQuantity !== "" ? Number(body.stockQuantity) : null;
    if ('weight' in body) updateData.weight = body.weight !== null && body.weight !== "" ? Number(body.weight) : null;
    if ('dimensionsWidth' in body) updateData.dimensionsWidth = body.dimensionsWidth !== null && body.dimensionsWidth !== "" ? Number(body.dimensionsWidth) : null;
    if ('dimensionsHeight' in body) updateData.dimensionsHeight = body.dimensionsHeight !== null && body.dimensionsHeight !== "" ? Number(body.dimensionsHeight) : null;
    if ('dimensionsDepth' in body) updateData.dimensionsDepth = body.dimensionsDepth !== null && body.dimensionsDepth !== "" ? Number(body.dimensionsDepth) : null;
    if ('color' in body) updateData.color = body.color || null;
    if ('material' in body) updateData.material = body.material || null;
    if ('tags' in body) updateData.tags = body.tags || null;
    if ('shippingCost' in body) updateData.shippingCost = body.shippingCost !== null && body.shippingCost !== "" ? Number(body.shippingCost) : null;
    if ('estimatedShippingDays' in body) updateData.estimatedShippingDays = body.estimatedShippingDays !== null && body.estimatedShippingDays !== "" ? Number(body.estimatedShippingDays) : null;
    if ('returnPolicy' in body) updateData.returnPolicy = body.returnPolicy || null;
    if ('warranty' in body) updateData.warranty = body.warranty || null;
    if ('specifications' in body) updateData.specifications = body.specifications || null;
    if ('isDraft' in body) updateData.isDraft = body.isDraft ?? false;
    
    // Handle image fields - if imageData is provided, use it; otherwise use imageUrl
    // CRITICAL: Only update image fields if explicitly provided to avoid accidentally clearing imageData
    if (imageData !== undefined) {
      // New image data provided (either from body or restored from specifications)
      // Clear imageUrl and set imageData
      updateData.imageData = imageData as any;
      updateData.imageMimeType = imageMimeType;
      updateData.imageUrl = null; // Clear imageUrl when using imageData
    } else if (body.imageUrl !== undefined) {
      // Only imageUrl provided - clear imageData and use imageUrl
      updateData.imageUrl = body.imageUrl || null;
      updateData.imageData = null;
      updateData.imageMimeType = null;
    } else {
      // Neither imageData nor imageUrl provided - preserve existing imageData
      // This is critical: if the product already has imageData, we must not clear it
      // Only restore if we successfully restored from specifications and current product has no imageData
      if (restoredFromSpecs && imageData !== undefined) {
        // Only restore if current product is missing imageData (it was lost somehow)
        if (!currentProduct?.imageData) {
          updateData.imageData = imageData as any;
          updateData.imageMimeType = imageMimeType;
          updateData.imageUrl = null;
        }
        // If current product already has imageData, don't overwrite it - preserve existing
      }
      // Otherwise, don't touch image fields - they will be preserved by Prisma
    }
    
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Update catalogue assignments if catalogueIds are provided
    if (body.catalogueIds && Array.isArray(body.catalogueIds)) {
      try {
        // Remove all existing catalogue assignments
        await (prisma as any).catalogueProduct.deleteMany({
          where: { productId: id },
        });

        // Add new catalogue assignments
        if (body.catalogueIds.length > 0) {
          await (prisma as any).catalogueProduct.createMany({
            data: body.catalogueIds.map((catalogueId: string) => ({
              catalogueId,
              productId: id,
            })),
            skipDuplicates: true,
          });
        }
      } catch (error: any) {
        console.error("Error updating product catalogues:", error);
        // Don't fail the request if catalogue assignment fails
      }
    }

    return NextResponse.json({
      product: {
        id: product.id,
        title: product.title,
        description: product.description ?? undefined,
        price: product.price,
        imageUrl: product.imageData ? `/api/products/${product.id}/image` : (product.imageUrl ?? undefined),
        imageMimeType: product.imageMimeType ?? undefined,
        category: product.category ?? undefined,
        brand: product.brand ?? undefined,
        sku: product.sku ?? undefined,
        stockQuantity: product.stockQuantity ?? undefined,
        weight: product.weight ?? undefined,
        dimensionsWidth: product.dimensionsWidth ?? undefined,
        dimensionsHeight: product.dimensionsHeight ?? undefined,
        dimensionsDepth: product.dimensionsDepth ?? undefined,
        color: product.color ?? undefined,
        material: product.material ?? undefined,
        condition: product.condition ?? undefined,
        tags: product.tags ?? undefined,
        shippingCost: product.shippingCost ?? undefined,
        estimatedShippingDays: product.estimatedShippingDays ?? undefined,
        returnPolicy: product.returnPolicy ?? undefined,
        warranty: product.warranty ?? undefined,
        specifications: product.specifications ?? undefined,
        isDraft: (product as any).isDraft ?? false,
        createdAt: product.createdAt.getTime(),
        updatedAt: product.updatedAt.getTime(),
      },
    });
  } catch (error: any) {
    return createErrorResponse(error?.message || "Failed to update product", 400);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("products.delete");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;

  try {
    await prisma.product.delete({
      where: { id },
    });

    return createSuccessResponse({ success: true });
  } catch (error: any) {
    return createErrorResponse(error?.message || "Failed to delete product", 400);
  }
}

