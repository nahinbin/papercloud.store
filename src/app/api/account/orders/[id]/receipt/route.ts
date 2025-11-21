import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserBySessionToken } from "@/lib/authDb";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If user is logged in, verify the order belongs to them
    // If not logged in, allow access (they have the order ID from confirmation page)
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const user = await getUserBySessionToken(token);
    
    if (user && order.userId && order.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate receipt HTML
    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - Order ${order.id.slice(0, 12)}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .order-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .total {
      text-align: right;
      font-size: 18px;
      font-weight: bold;
      margin-top: 20px;
    }
    .status {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status.pending { background-color: #fff3cd; color: #856404; }
    .status.paid { background-color: #d4edda; color: #155724; }
    .status.shipped { background-color: #cfe2ff; color: #084298; }
    .status.delivered { background-color: #d1e7dd; color: #0f5132; }
    .status.cancelled { background-color: #f8d7da; color: #842029; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Order Receipt</h1>
    <p>Order #${order.id.slice(0, 12).toUpperCase()}</p>
  </div>

  <div class="order-info">
    <div>
      <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Status:</strong> <span class="status ${order.status}">${order.status}</span></p>
      ${order.braintreeTxId ? `<p><strong>Transaction ID:</strong> ${order.braintreeTxId}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <h2>Shipping Information</h2>
    <p><strong>${order.shippingName}</strong></p>
    <p>${order.shippingAddress}</p>
    <p>${order.shippingCity}, ${order.shippingState || ''} ${order.shippingZip}</p>
    <p>${order.shippingCountry}</p>
    <p><strong>Email:</strong> ${order.email}</p>
  </div>

  <div class="section">
    <h2>Order Items</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>${item.productTitle}</td>
            <td>${item.quantity}</td>
            <td>$${item.productPrice.toFixed(2)}</td>
            <td>$${(item.productPrice * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="total">
      <strong>Total: $${order.totalAmount.toFixed(2)}</strong>
    </div>
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px;">
    <p>Thank you for your purchase!</p>
    <p>This is an automated receipt. Please keep this for your records.</p>
  </div>
</body>
</html>
    `;

    // Return HTML that can be printed or saved as PDF
    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="receipt-${order.id.slice(0, 12)}.html"`,
      },
    });
  } catch (error: any) {
    console.error("Receipt generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate receipt" },
      { status: 500 }
    );
  }
}

