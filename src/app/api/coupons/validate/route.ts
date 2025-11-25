import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { validateCoupon } from "@/lib/couponDb";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, items, subtotal } = body;

    if (!code || !items || subtotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user if logged in
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = token ? await getUserBySessionToken(token) : null;

    const result = await validateCoupon(
      code,
      items,
      Number(subtotal),
      user?.id
    );

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: result.coupon!.id,
        code: result.coupon!.code,
        name: result.coupon!.name,
        discountType: result.coupon!.discountType,
        discountValue: result.coupon!.discountValue,
      },
      discountAmount: result.discountAmount,
    });
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

