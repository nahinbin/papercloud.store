import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Receipt from "@/components/Receipt";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3">Order Confirmed!</h1>
          <p className="text-lg text-zinc-600 mb-6">
            Thank you for your purchase. We've received your order and will process it shortly.
          </p>
          
          {/* Order Summary Card */}
          <div className="bg-white border-2 border-green-200 rounded-lg p-6 mb-8 max-w-md mx-auto shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Order ID:</span>
                <span className="font-mono text-sm font-semibold">{order.id.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Order Date:</span>
                <span className="text-sm font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
                <span className="text-base font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600">Status:</span>
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {order.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Download Receipt CTA */}
          <div className="mb-8">
            <p className="text-sm text-zinc-600 mb-4">
              A confirmation email has been sent to <span className="font-semibold">{order.email}</span>
            </p>
            <p className="text-base font-medium text-zinc-800 mb-4">
              Download your receipt for your records:
            </p>
          </div>
        </div>

        {/* Modern Receipt */}
        <Receipt order={order} />

        <div className="text-center mt-12 space-y-4">
          <Link
            href="/"
            className="inline-block rounded bg-black px-8 py-3 text-white hover:bg-zinc-800 transition-colors font-medium"
          >
            Continue Shopping
          </Link>
          <p className="text-sm text-zinc-500">
            Need help? Contact us at {order.email}
          </p>
        </div>
      </div>
    </div>
  );
}

