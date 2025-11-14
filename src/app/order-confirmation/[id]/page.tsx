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

  return (
    <div className="min-h-screen w-full bg-zinc-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
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
          <h1 className="text-3xl font-semibold mb-2">Order Confirmed!</h1>
          <p className="text-zinc-600">
            Thank you for your purchase. Your receipt is ready to download below.
          </p>
        </div>

        {/* Modern Receipt */}
        <Receipt order={order} />

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-block rounded bg-black px-6 py-3 text-white hover:bg-zinc-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

