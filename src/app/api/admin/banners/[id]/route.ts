import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";
import { getBannerById } from "@/lib/bannerDb";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  
  if (!user) {
    return { error: "Unauthorized", status: 401, user: null };
  }
  
  const isAdmin = user.isAdmin || user.username === "@admin" || user.username === "admin";
  if (!isAdmin) {
    return { error: "Forbidden", status: 403, user: null };
  }
  
  return { error: null, status: 200, user };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Helper function to convert base64 data URL to buffer
    const convertImageData = (imageData: any, imageMimeType?: string) => {
      if (imageData === null) return { data: null, mimeType: null };
      if (!imageData) return { data: undefined, mimeType: undefined };
      
      let data: Buffer | null | undefined = undefined;
      let mime: string | null | undefined = undefined;
      
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
    
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title || null;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl || null;
    if (imageData.data !== undefined) updateData.imageData = imageData.data as any;
    if (imageData.mimeType !== undefined) updateData.imageMimeType = imageData.mimeType;
    if (body.mobileImageUrl !== undefined) updateData.mobileImageUrl = body.mobileImageUrl || null;
    if (mobileImageData.data !== undefined) updateData.mobileImageData = mobileImageData.data as any;
    if (mobileImageData.mimeType !== undefined) updateData.mobileImageMimeType = mobileImageData.mimeType;
    if (body.desktopImageUrl !== undefined) updateData.desktopImageUrl = body.desktopImageUrl || null;
    if (desktopImageData.data !== undefined) updateData.desktopImageData = desktopImageData.data as any;
    if (desktopImageData.mimeType !== undefined) updateData.desktopImageMimeType = desktopImageData.mimeType;
    if (body.linkUrl !== undefined) updateData.linkUrl = body.linkUrl || null;
    if (body.order !== undefined) updateData.order = Number(body.order);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    
    const banner = await (prisma as any).banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      banner: {
        id: banner.id,
        title: banner.title ?? undefined,
        imageUrl: banner.imageData ? `/api/banners/${banner.id}/image` : (banner.imageUrl ?? undefined),
        imageMimeType: banner.imageMimeType ?? undefined,
        mobileImageUrl: banner.mobileImageData ? `/api/banners/${banner.id}/mobile-image` : (banner.mobileImageUrl ?? undefined),
        mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
        desktopImageUrl: banner.desktopImageData ? `/api/banners/${banner.id}/desktop-image` : (banner.desktopImageUrl ?? undefined),
        desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
        linkUrl: banner.linkUrl ?? undefined,
        order: banner.order,
        isActive: banner.isActive,
        createdAt: banner.createdAt.getTime(),
        updatedAt: banner.updatedAt.getTime(),
      },
    });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to update banner";
    if (errorMessage.includes('Cannot read properties of undefined') || error?.name === 'TypeError') {
      return NextResponse.json(
        { error: "Banner model not available. Please run: npx prisma generate && npx prisma migrate dev" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const { id } = await params;

  try {
    await (prisma as any).banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const errorMessage = error?.message || "Failed to delete banner";
    if (errorMessage.includes('Cannot read properties of undefined') || error?.name === 'TypeError') {
      return NextResponse.json(
        { error: "Banner model not available. Please run: npx prisma generate && npx prisma migrate dev" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}

