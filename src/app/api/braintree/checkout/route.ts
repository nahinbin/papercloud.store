import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as braintree from "braintree";
import { prisma } from "@/lib/prisma";
import { getUserBySessionToken } from "@/lib/authDb";
import { applyCoupon } from "@/lib/couponDb";
import { sendOrderConfirmationEmail } from "@/lib/email";

function getGateway() {
  return new braintree.BraintreeGateway({
    environment:
      process.env.BRAINTREE_ENVIRONMENT === "production"
        ? braintree.Environment.Production
        : braintree.Environment.Sandbox,
    merchantId: process.env.BRAINTREE_MERCHANT_ID || "",
    publicKey: process.env.BRAINTREE_PUBLIC_KEY || "",
    privateKey: process.env.BRAINTREE_PRIVATE_KEY || "",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentMethodNonce, amount, items, shippingInfo, couponId, couponCode, discountAmount } = body;

    if (!items || !shippingInfo) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const orderAmount = parseFloat(amount || "0");
    const isFreeOrder = orderAmount === 0;

    // Validate stock availability before processing payment
    const stockValidationErrors: string[] = [];
    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, title: true, stockQuantity: true },
        });

        if (!product) {
          stockValidationErrors.push(`Product "${item.title}" no longer exists`);
          continue;
        }

        if (product.stockQuantity !== null && product.stockQuantity < item.quantity) {
          stockValidationErrors.push(
            `"${product.title}": Only ${product.stockQuantity} available, but ${item.quantity} requested`
          );
        } else if (product.stockQuantity === 0) {
          stockValidationErrors.push(`"${product.title}" is out of stock`);
        }
      }
    }

    if (stockValidationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock validation failed",
          stockErrors: stockValidationErrors,
        },
        { status: 400 }
      );
    }

    // Only process payment if order has a cost
    let transactionId: string | null = null;
    if (!isFreeOrder) {
      if (!paymentMethodNonce) {
        return NextResponse.json(
          { error: "Payment method required for paid orders" },
          { status: 400 }
        );
      }

      // Process payment with Braintree
      const gateway = getGateway();
      const result = await gateway.transaction.sale({
        amount: amount.toString(),
        paymentMethodNonce,
        options: {
          submitForSettlement: true,
        },
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.message || "Payment failed",
            errors: result.errors,
          },
          { status: 400 }
        );
      }

      transactionId = result.transaction.id;
    }

    // Get user if logged in
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = token ? await getUserBySessionToken(token) : null;

    // Apply coupon if provided
    if (couponId) {
      try {
        await applyCoupon(couponId);
      } catch (err) {
        console.error("Failed to apply coupon:", err);
        // Continue with order even if coupon application fails
      }
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user?.id,
        email: shippingInfo.email,
        shippingName: shippingInfo.name,
        shippingAddress: shippingInfo.address,
        shippingCity: shippingInfo.city,
        shippingState: shippingInfo.state,
        shippingZip: shippingInfo.zip,
        shippingCountry: shippingInfo.country || "US",
        totalAmount: orderAmount,
        status: isFreeOrder ? "paid" : "paid", // Free orders are also marked as paid
        braintreeTxId: transactionId,
        couponId: couponId || null,
        couponCode: couponCode || null,
        discountAmount: discountAmount ? parseFloat(discountAmount.toString()) : null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            productTitle: item.title,
            productPrice: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update product stock quantities
    for (const item of items) {
      if (item.productId) {
        try {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        } catch (err) {
          console.error(`Failed to update stock for product ${item.productId}:`, err);
          // Continue with other products even if one fails
        }
      }
    }

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || new URL(request.url).origin;
    sendOrderConfirmationEmail({
      to: order.email,
      order,
      orderUrl: `${appBaseUrl}/order-confirmation/${order.id}`,
    }).catch((error) => {
      console.error("Failed to send order confirmation email", error);
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      transaction: transactionId ? {
        id: transactionId,
        amount: orderAmount.toString(),
        status: "settled",
      } : null,
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 }
    );
  }
}

