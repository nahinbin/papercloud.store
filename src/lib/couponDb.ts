import { prisma } from "./prisma";

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productIds?: string[];
}

export interface CouponSummary {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  productIds: string[];
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount?: number;
}

export async function createCoupon(input: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usageCount">): Promise<Coupon> {
  try {
    if (!(prisma as any).coupon) {
      throw new Error("Coupon model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }

    const { productIds, ...couponData } = input;

    const coupon = await (prisma as any).coupon.create({
      data: {
        code: couponData.code.toUpperCase().trim(),
        name: couponData.name,
        description: couponData.description,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        minPurchaseAmount: couponData.minPurchaseAmount,
        maxDiscountAmount: couponData.maxDiscountAmount,
        usageLimit: couponData.usageLimit,
        userUsageLimit: couponData.userUsageLimit || 1,
        validFrom: couponData.validFrom,
        validUntil: couponData.validUntil,
        isActive: couponData.isActive,
        products: productIds && productIds.length > 0 ? {
          create: productIds.map((productId: string) => ({
            productId,
          })),
        } : undefined,
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount ?? undefined,
      maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
      usageLimit: coupon.usageLimit ?? undefined,
      usageCount: coupon.usageCount,
      userUsageLimit: coupon.userUsageLimit ?? undefined,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      productIds: coupon.products.map((cp: any) => cp.productId),
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("Coupon code already exists");
    }
    throw error;
  }
}

export async function listCoupons(activeOnly: boolean = false): Promise<CouponSummary[]> {
  try {
    const coupons = await (prisma as any).coupon.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });

    return coupons.map((coupon: any) => ({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount ?? undefined,
      maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      productIds: coupon.products.map((cp: any) => cp.productId),
    }));
  } catch (error: any) {
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.warn("Coupon table does not exist. Please run: npx prisma migrate dev");
      return [];
    }
    console.error("Error fetching coupons:", error);
    return [];
  }
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    const coupon = await (prisma as any).coupon.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });

    if (!coupon) return null;

    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount ?? undefined,
      maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
      usageLimit: coupon.usageLimit ?? undefined,
      usageCount: coupon.usageCount,
      userUsageLimit: coupon.userUsageLimit ?? undefined,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      productIds: coupon.products.map((cp: any) => cp.productId),
    };
  } catch (error: any) {
    console.error("Error fetching coupon:", error);
    return null;
  }
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const coupon = await (prisma as any).coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });

    if (!coupon) return null;

    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount ?? undefined,
      maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
      usageLimit: coupon.usageLimit ?? undefined,
      usageCount: coupon.usageCount,
      userUsageLimit: coupon.userUsageLimit ?? undefined,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      productIds: coupon.products.map((cp: any) => cp.productId),
    };
  } catch (error: any) {
    console.error("Error fetching coupon by code:", error);
    return null;
  }
}

export async function validateCoupon(
  code: string,
  cartItems: Array<{ productId: string; price: number; quantity: number }>,
  subtotal: number,
  userId?: string
): Promise<CouponValidationResult> {
  try {
    const coupon = await getCouponByCode(code);

    if (!coupon) {
      return { valid: false, error: "Coupon code not found" };
    }

    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is not active" };
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return { valid: false, error: "Coupon is not yet valid" };
    }

    if (now > coupon.validUntil) {
      return { valid: false, error: "Coupon has expired" };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
      return {
        valid: false,
        error: `Minimum purchase amount of $${coupon.minPurchaseAmount.toFixed(2)} required`,
      };
    }

    // Check if coupon applies to products in cart
    if (coupon.productIds && coupon.productIds.length > 0) {
      const cartProductIds = cartItems.map((item) => item.productId);
      const hasApplicableProduct = coupon.productIds.some((id) => cartProductIds.includes(id));
      if (!hasApplicableProduct) {
        return { valid: false, error: "Coupon does not apply to items in your cart" };
      }
    }

    // Check user usage limit
    if (userId && coupon.userUsageLimit) {
      const userUsageCount = await (prisma as any).order.count({
        where: {
          userId,
          couponId: coupon.id,
        },
      });

      if (userUsageCount >= coupon.userUsageLimit) {
        return { valid: false, error: "You have already used this coupon" };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
    };
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Error validating coupon" };
  }
}

export async function applyCoupon(couponId: string): Promise<void> {
  try {
    await (prisma as any).coupon.update({
      where: { id: couponId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Error applying coupon:", error);
    throw error;
  }
}

export async function updateCoupon(
  id: string,
  input: Partial<Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usageCount">>
): Promise<Coupon> {
  try {
    if (!(prisma as any).coupon) {
      throw new Error("Coupon model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }

    const { productIds, ...couponData } = input;

    // Get existing coupon to preserve usageCount
    const existing = await (prisma as any).coupon.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!existing) {
      throw new Error("Coupon not found");
    }

    // Update coupon
    const coupon = await (prisma as any).coupon.update({
      where: { id },
      data: {
        code: couponData.code ? couponData.code.toUpperCase().trim() : undefined,
        name: couponData.name,
        description: couponData.description,
        discountType: couponData.discountType,
        discountValue: couponData.discountValue,
        minPurchaseAmount: couponData.minPurchaseAmount,
        maxDiscountAmount: couponData.maxDiscountAmount,
        usageLimit: couponData.usageLimit,
        userUsageLimit: couponData.userUsageLimit,
        validFrom: couponData.validFrom,
        validUntil: couponData.validUntil,
        isActive: couponData.isActive,
        products: productIds !== undefined ? {
          deleteMany: {},
          create: productIds.map((productId: string) => ({
            productId,
          })),
        } : undefined,
      },
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
    });

    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description ?? undefined,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount ?? undefined,
      maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
      usageLimit: coupon.usageLimit ?? undefined,
      usageCount: coupon.usageCount,
      userUsageLimit: coupon.userUsageLimit ?? undefined,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
      productIds: coupon.products.map((cp: any) => cp.productId),
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("Coupon code already exists");
    }
    throw error;
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    if (!(prisma as any).coupon) {
      throw new Error("Coupon model not available. Please run: npx prisma generate && npx prisma migrate dev");
    }

    await (prisma as any).coupon.delete({
      where: { id },
    });
  } catch (error: any) {
    throw error;
  }
}

