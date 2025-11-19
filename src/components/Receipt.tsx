"use client";

import { useRef, useState } from "react";

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
  const [downloading, setDownloading] = useState(false);

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
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        unit: "pt",
        format: "a4",
        orientation: "portrait",
      });

      const marginX = 40;
      let y = 60;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text("PAPERCLOUD RECEIPT", marginX, y);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      y += 24;
      pdf.text(`Order ID: ${order.id}`, marginX, y);
      y += 18;
      pdf.text(`Order Date: ${formatDate(order.createdAt)}`, marginX, y);
      y += 18;
      pdf.text(`Status: ${order.status.toUpperCase()}`, marginX, y);
      y += 18;
      pdf.text(`Customer: ${order.shippingName}`, marginX, y);
      y += 18;
      pdf.text(`Email: ${order.email}`, marginX, y);

      y += 24;
      pdf.text("Shipping Address:", marginX, y);
      pdf.setFont("helvetica", "normal");
      y += 16;
      const addressLines = [
        order.shippingAddress,
        `${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ""} ${order.shippingZip}`,
        order.shippingCountry,
      ];
      addressLines.forEach((line) => {
        pdf.text(line, marginX, y);
        y += 14;
      });

      y += 10;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Items", marginX, y);
      y += 16;

      pdf.setFontSize(12);
      pdf.setDrawColor(200);
      pdf.line(marginX, y, pdf.internal.pageSize.getWidth() - marginX, y);
      y += 12;

      const addItemRow = (title: string, qty: number, price: number) => {
        const maxWidth = pdf.internal.pageSize.getWidth() - marginX * 2;
        const text = pdf.splitTextToSize(title, maxWidth - 200);
        pdf.text(text, marginX, y);
        pdf.text(`Qty: ${qty}`, pdf.internal.pageSize.getWidth() - marginX - 150, y);
        pdf.text(`$${price.toFixed(2)}`, pdf.internal.pageSize.getWidth() - marginX, y, { align: "right" });
        y += text.length * 14;
        y += 8;
      };

      order.items.forEach((item) => {
        addItemRow(item.productTitle, item.quantity, item.productPrice * item.quantity);
        if (y > pdf.internal.pageSize.getHeight() - 120) {
          pdf.addPage();
          y = 60;
        }
      });

      pdf.setDrawColor(0);
      pdf.line(marginX, y, pdf.internal.pageSize.getWidth() - marginX, y);
      y += 20;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(
        `Total: $${order.totalAmount.toFixed(2)}`,
        pdf.internal.pageSize.getWidth() - marginX,
        y,
        { align: "right" }
      );

      y += 30;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(
        "Thank you for shopping with PaperCloud! This document serves as your official receipt.",
        marginX,
        y
      );

      pdf.save(`receipt-${order.id}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("PDF download failed. Please try again or use print instead.");
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center no-print">
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-black to-zinc-800 px-8 py-4 text-white hover:from-zinc-800 hover:to-zinc-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
        >
          {downloading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
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
              Download Receipt (PDF)
            </>
          )}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-zinc-300 px-6 py-4 hover:bg-zinc-50 transition-colors font-medium"
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
          Print Receipt
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

