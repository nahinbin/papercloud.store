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

const withVersion = (url: string | undefined, updatedAt: Date | number) => {
  if (!url) return undefined;
  const version = typeof updatedAt === "number" ? updatedAt : updatedAt.getTime();
  return `${url}${url.includes("?") ? "&" : "?"}v=${version}`;
};

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

    const updatedAt = banner.updatedAt.getTime();

    return {
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData
        ? withVersion(`/api/banners/${banner.id}/image`, updatedAt)
        : withVersion(banner.imageUrl ?? undefined, updatedAt),
      imageData: banner.imageData ? Buffer.from(banner.imageData) : undefined,
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData
        ? withVersion(`/api/banners/${banner.id}/mobile-image`, updatedAt)
        : withVersion(banner.mobileImageUrl ?? undefined, updatedAt),
      mobileImageData: banner.mobileImageData ? Buffer.from(banner.mobileImageData) : undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData
        ? withVersion(`/api/banners/${banner.id}/desktop-image`, updatedAt)
        : withVersion(banner.desktopImageUrl ?? undefined, updatedAt),
      desktopImageData: banner.desktopImageData ? Buffer.from(banner.desktopImageData) : undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt,
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

    return banners.map((banner: any) => {
      const updatedAt = banner.updatedAt.getTime();
      return {
        id: banner.id,
        title: banner.title ?? undefined,
        imageUrl: banner.imageData
          ? withVersion(`/api/banners/${banner.id}/image`, updatedAt)
          : withVersion(banner.imageUrl ?? undefined, updatedAt),
        imageData: undefined, // Don't return image data in list (too large)
        imageMimeType: banner.imageMimeType ?? undefined,
        mobileImageUrl: banner.mobileImageData
          ? withVersion(`/api/banners/${banner.id}/mobile-image`, updatedAt)
          : withVersion(banner.mobileImageUrl ?? undefined, updatedAt),
        mobileImageData: undefined,
        mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
        desktopImageUrl: banner.desktopImageData
          ? withVersion(`/api/banners/${banner.id}/desktop-image`, updatedAt)
          : withVersion(banner.desktopImageUrl ?? undefined, updatedAt),
        desktopImageData: undefined,
        desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
        linkUrl: banner.linkUrl ?? undefined,
        order: banner.order,
        isActive: banner.isActive,
        createdAt: banner.createdAt.getTime(),
        updatedAt,
      };
    });
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

export async function listActiveBannerSummaries(): Promise<BannerSummary[]> {
  const banners = await listBanners(true);
  return banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    imageUrl: banner.imageUrl,
    mobileImageUrl: banner.mobileImageUrl,
    desktopImageUrl: banner.desktopImageUrl,
    linkUrl: banner.linkUrl,
    order: banner.order,
  }));
}

export async function getBannerById(id: string): Promise<Banner | null> {
  try {
    const banner = await (prisma as any).banner.findUnique({
      where: { id },
    });

    if (!banner) return null;

    const updatedAt = banner.updatedAt.getTime();

    return {
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData
        ? withVersion(`/api/banners/${banner.id}/image`, updatedAt)
        : withVersion(banner.imageUrl ?? undefined, updatedAt),
      imageData: banner.imageData ? Buffer.from(banner.imageData) : undefined,
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData
        ? withVersion(`/api/banners/${banner.id}/mobile-image`, updatedAt)
        : withVersion(banner.mobileImageUrl ?? undefined, updatedAt),
      mobileImageData: banner.mobileImageData ? Buffer.from(banner.mobileImageData) : undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData
        ? withVersion(`/api/banners/${banner.id}/desktop-image`, updatedAt)
        : withVersion(banner.desktopImageUrl ?? undefined, updatedAt),
      desktopImageData: banner.desktopImageData ? Buffer.from(banner.desktopImageData) : undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt,
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

    const updatedAt = banner.updatedAt.getTime();

    return {
      id: banner.id,
      title: banner.title ?? undefined,
      imageUrl: banner.imageData
        ? withVersion(`/api/banners/${banner.id}/image`, updatedAt)
        : withVersion(banner.imageUrl ?? undefined, updatedAt),
      imageData: banner.imageData ? Buffer.from(banner.imageData) : undefined,
      imageMimeType: banner.imageMimeType ?? undefined,
      mobileImageUrl: banner.mobileImageData
        ? withVersion(`/api/banners/${banner.id}/mobile-image`, updatedAt)
        : withVersion(banner.mobileImageUrl ?? undefined, updatedAt),
      mobileImageData: banner.mobileImageData ? Buffer.from(banner.mobileImageData) : undefined,
      mobileImageMimeType: banner.mobileImageMimeType ?? undefined,
      desktopImageUrl: banner.desktopImageData
        ? withVersion(`/api/banners/${banner.id}/desktop-image`, updatedAt)
        : withVersion(banner.desktopImageUrl ?? undefined, updatedAt),
      desktopImageData: banner.desktopImageData ? Buffer.from(banner.desktopImageData) : undefined,
      desktopImageMimeType: banner.desktopImageMimeType ?? undefined,
      linkUrl: banner.linkUrl ?? undefined,
      order: banner.order,
      isActive: banner.isActive,
      createdAt: banner.createdAt.getTime(),
      updatedAt,
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

