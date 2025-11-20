import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { createBanner, listBanners } from "@/lib/bannerDb";

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

export async function GET() {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  const banners = await listBanners(false); // Get all banners (including inactive) for admin
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const adminCheck = await checkAdmin();
  if (adminCheck.error) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
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
    
    return NextResponse.json({ id: banner.id, banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create banner. Please ensure the Banner model is set up: run 'npx prisma generate && npx prisma migrate dev'" },
      { status: 500 }
    );
  }
}

