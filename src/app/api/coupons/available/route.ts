import { NextResponse } from "next/server";
import { listCoupons } from "@/lib/couponDb";

export async function GET() {
  try {
    // Get only active coupons that are currently valid
    const now = new Date();
    const allCoupons = await listCoupons(true);
    
    const availableCoupons = allCoupons.filter((coupon) => {
      return (
        coupon.isActive &&
        new Date(coupon.validFrom) <= now &&
        new Date(coupon.validUntil) >= now
      );
    });

    return NextResponse.json({
      coupons: availableCoupons.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        validUntil: coupon.validUntil,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching available coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

