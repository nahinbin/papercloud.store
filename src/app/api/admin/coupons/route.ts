import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { createCoupon, listCoupons } from "@/lib/couponDb";

export async function GET() {
  const auth = await requirePermission("coupons.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  try {
    const coupons = await listCoupons(false); // Get all coupons (including inactive) for admin
    const response = createSuccessResponse({ coupons });
    response.headers.set("Cache-Control", "private, s-maxage=30, stale-while-revalidate=60");
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requirePermission("coupons.create");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const coupon = await createCoupon({
      code: body.code,
      name: body.name,
      description: body.description || undefined,
      discountType: body.discountType, // "percentage" or "fixed"
      discountValue: Number(body.discountValue),
      minPurchaseAmount: body.minPurchaseAmount ? Number(body.minPurchaseAmount) : undefined,
      maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : undefined,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : undefined,
      userUsageLimit: body.userUsageLimit ? Number(body.userUsageLimit) : undefined,
      validFrom: new Date(body.validFrom),
      validUntil: new Date(body.validUntil),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      productIds: body.productIds || [],
    });

    return createSuccessResponse({ id: coupon.id, coupon }, 201);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create coupon" },
      { status: 500 }
    );
  }
}

