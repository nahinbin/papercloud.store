import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { createBanner, listBanners } from "@/lib/bannerDb";

export async function GET() {
  const auth = await requirePermission("banners.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const banners = await listBanners(false); // Get all banners (including inactive) for admin
  const response = createSuccessResponse({ banners });
  // Cache for 30 seconds, stale-while-revalidate for 60 seconds
  response.headers.set("Cache-Control", "private, s-maxage=30, stale-while-revalidate=60");
  return response;
}

export async function POST(request: Request) {
  const auth = await requirePermission("banners.create");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  
  // Helper function to convert base64 data URL to buffer
  const convertImageData = (imageData: any, imageMimeType?: string) => {
    if (!imageData) return { data: undefined, mimeType: undefined };
    
    let data: Buffer | undefined = undefined;
    let mime: string | undefined = undefined;
    
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mime = matches[1];
        const base64Data = matches[2];
        data = Buffer.from(base64Data, 'base64');
      }
    } else if (imageData && imageMimeType) {
      data = Buffer.from(imageData, 'base64');
      mime = imageMimeType;
    }
    
    return { data, mimeType: mime };
  };

  const imageData = convertImageData(body.imageData, body.imageMimeType);
  const mobileImageData = convertImageData(body.mobileImageData, body.mobileImageMimeType);
  const desktopImageData = convertImageData(body.desktopImageData, body.desktopImageMimeType);
  
  try {
    const banner = await createBanner({
      title: body.title || undefined,
      imageUrl: body.imageUrl || undefined,
      imageData: imageData.data,
      imageMimeType: imageData.mimeType,
      mobileImageUrl: body.mobileImageUrl || undefined,
      mobileImageData: mobileImageData.data,
      mobileImageMimeType: mobileImageData.mimeType,
      desktopImageUrl: body.desktopImageUrl || undefined,
      desktopImageData: desktopImageData.data,
      desktopImageMimeType: desktopImageData.mimeType,
      linkUrl: body.linkUrl || undefined,
      order: body.order !== undefined ? Number(body.order) : 0,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });
    
    // Revalidate the cache after creating a new banner
    const { revalidateTag } = await import("next/cache");
    revalidateTag("banners", "max");
    
    return createSuccessResponse({ id: banner.id, banner }, 201);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create banner. Please ensure the Banner model is set up: run 'npx prisma generate && npx prisma migrate dev'" },
      { status: 500 }
    );
  }
}

