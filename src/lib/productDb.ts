import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { Product } from "@/types/product";

export type ProductSummary = Pick<
  Product,
  "id" | "title" | "description" | "price" | "imageUrl" | "brand" | "stockQuantity"
>;

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
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  };
}

export async function listProducts(): Promise<Product[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

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
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  }));
}

const cachedHomeProducts = unstable_cache(
  async (limit: number) => {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
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

    return products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description ?? undefined,
      price: product.price,
      imageUrl: product.imageData ? `/api/products/${product.id}/image` : (product.imageUrl ?? undefined),
      brand: product.brand ?? undefined,
      stockQuantity: product.stockQuantity ?? undefined,
    }));
  },
  ["home", "products", "summary"],
  { revalidate: 60 },
);

export async function listHomeProducts(limit = 12): Promise<ProductSummary[]> {
  return cachedHomeProducts(limit) as Promise<ProductSummary[]>;
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

