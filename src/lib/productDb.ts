import { prisma } from "./prisma";
import type { Product } from "@/types/product";

export async function createProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const product = await prisma.product.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price,
      imageUrl: input.imageUrl,
      imageData: input.imageData ? Buffer.from(input.imageData) : null,
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

export async function getProductById(id: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { id },
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
}

