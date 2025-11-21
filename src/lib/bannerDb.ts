import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export interface Banner {
  id: string;
  title?: string;
  imageUrl?: string;
  imageData?: Buffer;
  imageMimeType?: string;
  mobileImageUrl?: string;
  mobileImageData?: Buffer;
  mobileImageMimeType?: string;
  desktopImageUrl?: string;
  desktopImageData?: Buffer;
  desktopImageMimeType?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type BannerSummary = Pick<Banner, "id" | "title" | "imageUrl" | "mobileImageUrl" | "desktopImageUrl" | "linkUrl" | "order">;

export async function createBanner(input: Omit<Banner, "id" | "createdAt" | "updatedAt">): Promise<Banner> {
  try {
    // Check if banner model exists before trying to use it
    if (!(prisma as any).banner) {
      throw new Error("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }

    const banner = await (prisma as any).banner.create({
      data: {
        title: input.title,
        imageUrl: input.imageUrl,
        imageData: input.imageData ? (input.imageData as any) : null,
        imageMimeType: input.imageMimeType,
        mobileImageUrl: input.mobileImageUrl,
        mobileImageData: input.mobileImageData ? (input.mobileImageData as any) : null,
        mobileImageMimeType: input.mobileImageMimeType,
        desktopImageUrl: input.desktopImageUrl,
        desktopImageData: input.desktopImageData ? (input.desktopImageData as any) : null,
        desktopImageMimeType: input.desktopImageMimeType,
        linkUrl: input.linkUrl,
        order: input.order,
        isActive: input.isActive,
      },
    });

    return {
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageUrl ?? undefined,
      imageData: banner.imageData ? Buffer.from(banner.imageData) : undefined,
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData ? `/api/banners/${banner.id}/mobile-image` : (banner.mobileImageUrl ?? undefined),
      mobileImageData: banner.mobileImageData ? Buffer.from(banner.mobileImageData) : undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData ? `/api/banners/${banner.id}/desktop-image` : (banner.desktopImageUrl ?? undefined),
      desktopImageData: banner.desktopImageData ? Buffer.from(banner.desktopImageData) : undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt: banner.updatedAt.getTime(),
    };
  } catch (error: any) {
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.message?.includes('Banner model not available') ||
        error?.name === 'TypeError' ||
        !(prisma as any).banner) {
      throw new Error("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }
    throw error;
  }
}

export async function listBanners(activeOnly: boolean = false): Promise<Banner[]> {
  try {
    const banners = await (prisma as any).banner.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return banners.map((banner: any) => ({
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData ? `/api/banners/${banner.id}/image` : (banner.imageUrl ?? undefined),
      imageData: undefined, // Don't return image data in list (too large)
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData ? `/api/banners/${banner.id}/mobile-image` : (banner.mobileImageUrl ?? undefined),
      mobileImageData: undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData ? `/api/banners/${banner.id}/desktop-image` : (banner.desktopImageUrl ?? undefined),
      desktopImageData: undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt: banner.updatedAt.getTime(),
    }));
  } catch (error: any) {
    // Handle case where Banner table doesn't exist yet
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.warn("Banner table does not exist. Please run: npx prisma migrate dev");
      return [];
    }
    // Handle case where Banner model is not in Prisma client (undefined error)
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.message?.includes('banner') ||
        error?.name === 'TypeError') {
      console.warn("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
      return [];
    }
    console.error("Error fetching banners:", error);
    return [];
  }
}

const cachedActiveBanners = unstable_cache(
  async () => {
    if (!(prisma as any).banner) {
      console.warn("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
      return [];
    }

    const banners = await (prisma as any).banner.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        imageData: true,
        mobileImageUrl: true,
        mobileImageData: true,
        desktopImageUrl: true,
        desktopImageData: true,
        linkUrl: true,
        order: true,
      },
    });

    return banners.map((banner: any) => ({
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData ? `/api/banners/${banner.id}/image` : (banner.imageUrl ?? undefined),
      mobileImageUrl: banner.mobileImageData ? `/api/banners/${banner.id}/mobile-image` : (banner.mobileImageUrl ?? undefined),
      desktopImageUrl: banner.desktopImageData ? `/api/banners/${banner.id}/desktop-image` : (banner.desktopImageUrl ?? undefined),
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
    }));
  },
  ["banners", "active", "summary"],
  { revalidate: 900 },
);

export async function listActiveBannerSummaries(): Promise<BannerSummary[]> {
  return cachedActiveBanners() as Promise<BannerSummary[]>;
}

export async function getBannerById(id: string): Promise<Banner | null> {
  try {
    const banner = await (prisma as any).banner.findUnique({
      where: { id },
    });

    if (!banner) return null;

    return {
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData ? `/api/banners/${banner.id}/image` : (banner.imageUrl ?? undefined),
      imageData: banner.imageData ? Buffer.from(banner.imageData) : undefined,
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData ? `/api/banners/${banner.id}/mobile-image` : (banner.mobileImageUrl ?? undefined),
      mobileImageData: banner.mobileImageData ? Buffer.from(banner.mobileImageData) : undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData ? `/api/banners/${banner.id}/desktop-image` : (banner.desktopImageUrl ?? undefined),
      desktopImageData: banner.desktopImageData ? Buffer.from(banner.desktopImageData) : undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt: banner.updatedAt.getTime(),
    };
  } catch (error: any) {
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.name === 'TypeError') {
      console.warn("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
      return null;
    }
    throw error;
  }
}

export async function updateBanner(
  id: string,
  input: Partial<Omit<Banner, "id" | "createdAt" | "updatedAt">>
): Promise<Banner> {
  try {
    // Check if banner model exists before trying to use it
    if (!(prisma as any).banner) {
      throw new Error("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }

    const banner = await (prisma as any).banner.update({
      where: { id },
      data: {
        title: input.title,
        imageUrl: input.imageUrl,
        imageData: input.imageData ? (input.imageData as any) : undefined,
        imageMimeType: input.imageMimeType,
        mobileImageUrl: input.mobileImageUrl,
        mobileImageData: input.mobileImageData ? (input.mobileImageData as any) : undefined,
        mobileImageMimeType: input.mobileImageMimeType,
        desktopImageUrl: input.desktopImageUrl,
        desktopImageData: input.desktopImageData ? (input.desktopImageData as any) : undefined,
        desktopImageMimeType: input.desktopImageMimeType,
        linkUrl: input.linkUrl,
        order: input.order,
        isActive: input.isActive,
      },
    });

    return {
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData ? `/api/banners/${banner.id}/image` : (banner.imageUrl ?? undefined),
      imageData: banner.imageData ? Buffer.from(banner.imageData) : undefined,
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData ? `/api/banners/${banner.id}/mobile-image` : (banner.mobileImageUrl ?? undefined),
      mobileImageData: banner.mobileImageData ? Buffer.from(banner.mobileImageData) : undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData ? `/api/banners/${banner.id}/desktop-image` : (banner.desktopImageUrl ?? undefined),
      desktopImageData: banner.desktopImageData ? Buffer.from(banner.desktopImageData) : undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt: banner.updatedAt.getTime(),
    };
  } catch (error: any) {
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.message?.includes('Banner model not available') ||
        error?.name === 'TypeError' ||
        !(prisma as any).banner) {
      throw new Error("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }
    throw error;
  }
}

export async function deleteBanner(id: string): Promise<void> {
  try {
    // Check if banner model exists before trying to use it
    if (!(prisma as any).banner) {
      throw new Error("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }

    await (prisma as any).banner.delete({
      where: { id },
    });
  } catch (error: any) {
    if (error?.message?.includes('Cannot read properties of undefined') || 
        error?.message?.includes('Banner model not available') ||
        error?.name === 'TypeError' ||
        !(prisma as any).banner) {
      throw new Error("Banner model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }
    throw error;
  }
}

