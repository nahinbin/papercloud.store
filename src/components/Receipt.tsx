"use client";

import { useEffect, useRef } from "react";

interface OrderItem {
  id: string;
  productTitle: string;
  productPrice: number;
  quantity: number;
}

interface ReceiptProps {
  order: {
    id: string;
    email: string;
    shippingName: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState?: string | null;
    shippingZip: string;
    shippingCountry: string;
    totalAmount: number;
    status: string;
    braintreeTxId?: string | null;
    createdAt: Date;
    items: OrderItem[];
  };
}

export default function Receipt({ order }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const downloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      // Dynamic import for smaller bundle
      const html2pdf = (await import("html2pdf.js")).default;
      
      const element = receiptRef.current;
      const opt = {
        margin: [0.5, 0.5] as [number, number],
        filename: `receipt-${order.id}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: "in" as const, 
          format: "letter" as const, 
          orientation: "portrait" as const
        },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
      // Fallback to print
      alert("PDF download failed. Using print instead.");
      window.print();
    }
  };

  return (
    <>
      <div className="mb-6 flex gap-4 justify-center no-print">
        <button
          onClick={downloadPDF}
          className="inline-flex items-center gap-2 rounded bg-black px-6 py-3 text-white hover:bg-zinc-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download Receipt
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded border px-6 py-3 hover:bg-zinc-50 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
      </div>

      <div
        ref={receiptRef}
        className="receipt-print bg-white p-8 max-w-2xl mx-auto shadow-lg"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">PAPERCLOUD</h1>
              <p className="text-zinc-600 text-sm">Thank you for your purchase!</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                PAID
              </div>
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Order Details
            </h3>
            <p className="text-sm mb-1">
              <span className="font-semibold">Order ID:</span>{" "}
              <span className="font-mono text-xs">{order.id}</span>
            </p>
            <p className="text-sm mb-1">
              <span className="font-semibold">Date:</span> {formatDate(order.createdAt)}
            </p>
            {order.braintreeTxId && (
              <p className="text-sm">
                <span className="font-semibold">Transaction:</span>{" "}
                <span className="font-mono text-xs">{order.braintreeTxId}</span>
              </p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Billing Address
            </h3>
            <p className="text-sm">{order.shippingName}</p>
            <p className="text-sm">{order.shippingAddress}</p>
            <p className="text-sm">
              {order.shippingCity}
              {order.shippingState && `, ${order.shippingState}`} {order.shippingZip}
            </p>
            <p className="text-sm">{order.shippingCountry}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                  Item
                </th>
                <th className="text-center py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                  Qty
                </th>
                <th className="text-right py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                  Price
                </th>
                <th className="text-right py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className={index !== order.items.length - 1 ? "border-b border-zinc-100" : ""}>
                  <td className="py-4">
                    <p className="font-semibold">{item.productTitle}</p>
                  </td>
                  <td className="text-center py-4 text-zinc-600">{item.quantity}</td>
                  <td className="text-right py-4 text-zinc-600">
                    ${item.productPrice.toFixed(2)}
                  </td>
                  <td className="text-right py-4 font-semibold">
                    ${(item.productPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="border-t-2 border-black pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 pt-6 text-center text-xs text-zinc-500">
          <p className="mb-2">
            Questions? Contact us at {order.email}
          </p>
          <p>This is your official receipt. Please keep it for your records.</p>
        </div>
      </div>
    </>
  );
}

