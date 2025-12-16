import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { Product } from "@/types/product";

export type ProductSummary = Pick<
  Product,
  "id" | "title" | "description" | "price" | "imageUrl" | "brand" | "stockQuantity"
>;

type HomeProductPage = {
  products: ProductSummary[];
  nextCursor: string | null;
  total: number;
};

const mapHomeProduct = (product: any): ProductSummary => ({
  id: product.id,
  title: product.title,
  description: product.description ?? undefined,
  price: product.price,
  imageUrl: product.imageData ? `/api/products/${product.id}/image` : (product.imageUrl ?? undefined),
  brand: product.brand ?? undefined,
  stockQuantity: product.stockQuantity ?? undefined,
});

export async function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const product = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price,
      imageUrl: input.imageUrl,
      imageData: input.imageData ? (input.imageData as any) : null,
      imageMimeType: input.imageMimeType,
      category: input.category,
      brand: input.brand,
      sku: input.sku,
      stockQuantity: input.stockQuantity,
      weight: input.weight,
      dimensionsWidth: input.dimensionsWidth,
      dimensionsHeight: input.dimensionsHeight,
      dimensionsDepth: input.dimensionsDepth,
      color: input.color,
      material: input.material,
      condition: input.condition,
      tags: input.tags,
      shippingCost: input.shippingCost,
      estimatedShippingDays: input.estimatedShippingDays,
      returnPolicy: input.returnPolicy,
      warranty: input.warranty,
      specifications: input.specifications,
      isDraft: input.isDraft ?? false,
      order: input.order ?? 0,
    },
  });

  return {
    id: product.id,
    title: product.title,
    description: product.description ?? undefined,
    price: product.price,
    imageUrl: product.imageUrl ?? undefined,
    imageData: product.imageData ? Buffer.from(product.imageData) : undefined,
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
    isDraft: product.isDraft ?? false,
    order: product.order ?? 0,
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  };
}

export async function listProducts(includeDrafts: boolean = false): Promise<Product[]> {
  let products;
  try {
    // Try to use order field if Prisma Client has been regenerated
    products = await prisma.product.findMany({
      where: includeDrafts ? undefined : { isDraft: false },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
  } catch (error: any) {
    // Fallback if order field doesn't exist in Prisma Client yet
    if (error.message?.includes("Unknown argument `order`")) {
      // Fetch all products and sort manually
      products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      
      // Fetch order values using raw query
      const orderData = await prisma.$queryRaw<Array<{ id: string; order: number }>>`
        SELECT id, "order" FROM products
      `;
      const orderMap = new Map(orderData.map(p => [p.id, p.order ?? 0]));
      
      // Sort by order, then by createdAt
      products.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 0;
        const orderB = orderMap.get(b.id) ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    } else {
      throw error;
    }
  }

  return products.map((product) => ({
    id: product.id,
    title: product.title,
    description: product.description ?? undefined,
    price: product.price,
    // For list, use image URL endpoint if imageData exists, otherwise use imageUrl
    imageUrl: product.imageData ? `/api/products/${product.id}/image` : (product.imageUrl ?? undefined),
    imageData: undefined, // Don't return image data in list (too large)
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
    order: (product as any).order ?? 0,
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  }));
}

// Removed caching to ensure immediate updates since home page is force-dynamic.
// Supports cursor-based pagination so we don't have to load every product at once.
async function getOrderedHomeProducts(limitPlusOne: number, cursor?: string) {
  let products: any[];
  try {
    // Try to use order field if Prisma Client has been regenerated
    products = await prisma.product.findMany({
      where: {
        isDraft: false, // Exclude drafts from public view
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      take: limitPlusOne,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1, // Skip the cursor item itself
          }
        : {}),
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        imageData: true,
        brand: true,
        stockQuantity: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error: any) {
    // Fallback if order field doesn't exist in Prisma Client yet
    if (error.message?.includes("Unknown argument `order`")) {
      // Fetch all products and sort manually
      const allProducts = await prisma.product.findMany({
        where: { isDraft: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          imageUrl: true,
          imageData: true,
          brand: true,
          stockQuantity: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      // Fetch order values using raw query
      const orderData = await prisma.$queryRaw<Array<{ id: string; order: number }>>`
        SELECT id, "order" FROM products
      `;
      const orderMap = new Map(orderData.map(p => [p.id, p.order ?? 0]));
      
      // Sort by order, then by createdAt
      allProducts.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 0;
        const orderB = orderMap.get(b.id) ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Apply cursor pagination manually
      const startIndex = cursor ? allProducts.findIndex((p) => p.id === cursor) + 1 : 0;
      const safeStart = Math.max(startIndex, 0);
      products = allProducts.slice(safeStart, safeStart + limitPlusOne);
    } else {
      throw error;
    }
  }

  return products.map(mapHomeProduct);
}

export async function listHomeProducts(limit = 100): Promise<ProductSummary[]> {
  const { products } = await listHomeProductsPage(limit);
  return products;
}

export async function listHomeProductsPage(limit = 12, cursor?: string): Promise<HomeProductPage> {
  const pageSize = Math.max(4, Math.min(limit, 40)); // keep pages reasonable
  const take = pageSize + 1; // fetch one extra to know if there's another page

  const [products, total] = await Promise.all([
    getOrderedHomeProducts(take, cursor),
    prisma.product.count({ where: { isDraft: false } }),
  ]);

  const hasNext = products.length > pageSize;
  const items = hasNext ? products.slice(0, -1) : products;
  const nextCursor = hasNext ? items[items.length - 1]?.id ?? null : null;

  return {
    products: items,
    nextCursor,
    total,
  };
}

const cachedProductById = unstable_cache(
  async (id: string) => {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        imageUrl: true,
        imageData: true,
        imageMimeType: true,
        category: true,
        brand: true,
        sku: true,
        stockQuantity: true,
        weight: true,
        dimensionsWidth: true,
        dimensionsHeight: true,
        dimensionsDepth: true,
        color: true,
        material: true,
        condition: true,
        tags: true,
        shippingCost: true,
        estimatedShippingDays: true,
        returnPolicy: true,
        warranty: true,
        specifications: true,
        isDraft: true,
        order: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) return null;

    return {
      id: product.id,
      title: product.title,
      description: product.description ?? undefined,
      price: product.price,
      // Use image URL endpoint if imageData exists, otherwise use imageUrl
      imageUrl: product.imageData ? `/api/products/${product.id}/image` : (product.imageUrl ?? undefined),
      imageData: product.imageData ? Buffer.from(product.imageData) : undefined,
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
      order: (product as any).order ?? 0,
      createdAt: product.createdAt.getTime(),
      updatedAt: product.updatedAt.getTime(),
    };
  },
  ["product", "by-id"],
  { revalidate: 300 }, // Cache for 5 minutes
);

export async function getProductById(id: string): Promise<Product | null> {
  return cachedProductById(id) as Promise<Product | null>;
}

