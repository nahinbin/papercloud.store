import { prisma } from "./prisma";

export interface Catalogue {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  imageData?: Buffer;
  imageMimeType?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  productIds: string[];
  createdAt: number;
  updatedAt: number;
}

function normalizeCatalogue(record: any, includeData = false): Catalogue {
  return {
    id: record.id,
    title: record.title,
    slug: record.slug ?? undefined,
    description: record.description ?? undefined,
    content: record.content ?? undefined,
    imageUrl: record.imageData ? `/api/catalogues/${record.id}/image` : record.imageUrl ?? undefined,
    imageData: includeData && record.imageData ? Buffer.from(record.imageData) : undefined,
    imageMimeType: record.imageMimeType ?? undefined,
    linkUrl: record.linkUrl ?? undefined,
    order: record.order,
    isActive: record.isActive,
    productIds: record.products?.map((p: any) => p.productId) ?? [],
    createdAt: record.createdAt.getTime(),
    updatedAt: record.updatedAt.getTime(),
  };
}

export async function listCatalogues(activeOnly = false): Promise<Catalogue[]> {
  try {
    if (!(prisma as any).catalogue) {
      console.warn("Catalogue model not available. Please run: npx prisma generate && npx prisma migrate dev");
      return [];
    }

    const catalogues = await (prisma as any).catalogue.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });

    return catalogues.map((catalogue: any) => normalizeCatalogue(catalogue));
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.warn("Catalogue table does not exist. Please run: npx prisma migrate dev");
      return [];
    }
    if (
      error?.message?.includes("catalogue") &&
      error?.message?.includes("not available")
    ) {
      console.warn("Catalogue model not available. Please run: npx prisma generate && npx prisma migrate dev");
      return [];
    }
    console.error("Error fetching catalogues:", error);
    return [];
  }
}

export async function getCatalogueById(id: string): Promise<Catalogue | null> {
  try {
    const catalogue = await (prisma as any).catalogue.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });
    if (!catalogue) return null;
    return normalizeCatalogue(catalogue, true);
  } catch (error: any) {
    if (error?.message?.includes("cannot read properties of undefined") || error?.name === "TypeError") {
      console.warn("Catalogue model not available. Please run: npx prisma generate && npx prisma migrate dev");
      return null;
    }
    throw error;
  }
}

export async function createCatalogue(
  input: Omit<Catalogue, "id" | "createdAt" | "updatedAt">
): Promise<Catalogue> {
  if (!(prisma as any).catalogue) {
    throw new Error("Catalogue model not available. Please run: npx prisma generate && npx prisma migrate dev");
  }

  const record = await (prisma as any).catalogue.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      content: input.content,
      imageUrl: input.imageUrl,
      imageData: input.imageData ? (input.imageData as any) : null,
      imageMimeType: input.imageMimeType,
      linkUrl: input.linkUrl,
      order: input.order,
      isActive: input.isActive,
      products: input.productIds?.length
        ? {
            create: input.productIds.map((productId) => ({
              product: { connect: { id: productId } },
            })),
          }
        : undefined,
    },
    include: {
      products: { select: { productId: true } },
    },
  });

  return normalizeCatalogue(record, true);
}

export async function updateCatalogue(
  id: string,
  input: Partial<Omit<Catalogue, "id" | "createdAt" | "updatedAt">>
): Promise<Catalogue> {
  if (!(prisma as any).catalogue) {
    throw new Error("Catalogue model not available. Please run: npx prisma generate && npx prisma migrate dev");
  }

  const record = await (prisma as any).catalogue.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      content: input.content,
      imageUrl: input.imageUrl,
      imageData: input.imageData ? (input.imageData as any) : input.imageData === null ? null : undefined,
      imageMimeType: input.imageMimeType,
      linkUrl: input.linkUrl,
      order: input.order,
      isActive: input.isActive,
    },
    include: {
      products: { select: { productId: true } },
    },
  });

  if (input.productIds) {
    await (prisma as any).catalogueProduct.deleteMany({ where: { catalogueId: id } });
    if (input.productIds.length) {
      await (prisma as any).catalogueProduct.createMany({
        data: input.productIds.map((productId) => ({
          catalogueId: id,
          productId,
        })),
      });
    }
  }

  const refreshed = await (prisma as any).catalogue.findUnique({
    where: { id },
    include: { products: { select: { productId: true } } },
  });

  return normalizeCatalogue(refreshed ?? record, true);
}

export async function deleteCatalogue(id: string): Promise<void> {
  if (!(prisma as any).catalogue) {
    throw new Error("Catalogue model not available. Please run: npx prisma generate && npx prisma migrate dev");
  }

  await (prisma as any).catalogue.delete({ where: { id } });
}

export async function getCatalogueWithProducts(identifier: string) {
  if (!(prisma as any).catalogue) {
    return null;
  }

  const catalogue = await (prisma as any).catalogue.findFirst({
    where: {
      OR: [
        { slug: identifier },
        { id: identifier },
      ],
    },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!catalogue) {
    return null;
  }

  const normalized = normalizeCatalogue(
    {
      ...catalogue,
      products: catalogue.products.map((cp: any) => ({
        productId: cp.productId,
      })),
    },
    true,
  );

  const products = catalogue.products.map((cp: any) => cp.product).filter(Boolean);

  return {
    catalogue: normalized,
    products,
  };
}

