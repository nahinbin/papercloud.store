"use client";

import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-screen w-full bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-semibold mb-8">Shopping Cart</h1>
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">Your cart is empty</p>
            <Link
              href="/"
              className="inline-block rounded bg-black px-6 py-3 text-white hover:bg-zinc-800"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold mb-8">Shopping Cart</h1>

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 border rounded-lg p-4"
            >
              {item.imageUrl && (
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover rounded"
                    unoptimized={item.imageUrl.startsWith("http")}
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-zinc-600 mb-2">${item.price.toFixed(2)}</p>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-zinc-600">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded border flex items-center justify-center hover:bg-zinc-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                      className="w-8 h-8 rounded border flex items-center justify-center hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold mb-2">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-semibold">Total:</span>
            <span className="text-2xl font-bold">${getTotal().toFixed(2)}</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 rounded border px-6 py-3 text-center hover:bg-zinc-50"
            >
              Continue Shopping
            </Link>
            <button
              onClick={clearCart}
              className="rounded border px-6 py-3 hover:bg-zinc-50"
            >
              Clear Cart
            </button>
            <button
              onClick={() => router.push("/checkout")}
              className="flex-1 rounded bg-black px-6 py-3 text-white hover:bg-zinc-800"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

