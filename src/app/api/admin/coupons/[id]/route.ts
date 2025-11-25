import { NextResponse } from "next/server";
import { requirePermission, createErrorResponse, createSuccessResponse } from "@/lib/adminAuth";
import { getCouponById, updateCoupon, deleteCoupon } from "@/lib/couponDb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("coupons.view");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;

  try {
    const coupon = await getCouponById(id);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    return createSuccessResponse({ coupon });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("coupons.update");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updateData: any = {};
    if (body.code !== undefined) updateData.code = body.code;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
    if (body.minPurchaseAmount !== undefined) {
      updateData.minPurchaseAmount = body.minPurchaseAmount ? Number(body.minPurchaseAmount) : null;
    }
    if (body.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    }
    if (body.usageLimit !== undefined) {
      updateData.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    }
    if (body.userUsageLimit !== undefined) {
      updateData.userUsageLimit = body.userUsageLimit ? Number(body.userUsageLimit) : null;
    }
    if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updateData.validUntil = new Date(body.validUntil);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.productIds !== undefined) updateData.productIds = body.productIds || [];

    const coupon = await updateCoupon(id, updateData);
    return createSuccessResponse({ coupon });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePermission("coupons.delete");
  if (auth.error) {
    return createErrorResponse(auth.error, auth.status);
  }

  const { id } = await params;

  try {
    await deleteCoupon(id);
    return createSuccessResponse({ message: "Coupon deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete coupon" },
      { status: 500 }
    );
  }
}

