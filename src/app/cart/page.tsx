"use client";

import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart, isLoading } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering cart content until mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl border border-zinc-100 bg-white/80 p-10 text-center shadow-sm">
            <p className="text-zinc-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl border border-zinc-100 bg-white/80 p-10 text-center shadow-sm">
            <h1 className="text-3xl font-semibold mb-4">Shopping cart</h1>
            <p className="text-zinc-600 mb-6">Your cart is empty.</p>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-zinc-900/10 bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-black"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleRemove = (productId: string) => {
    if (confirm("Are you sure you want to remove this item from your cart?")) {
      removeItem(productId);
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemove(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Cart</p>
            <h1 className="text-3xl font-semibold">Shopping cart</h1>
          </div>
          <span className="text-sm text-zinc-500">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>

        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-3xl border border-zinc-100 bg-white/80 p-4 shadow-sm flex-col sm:flex-row"
            >
              {item.imageUrl && (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden sm:w-32 sm:h-32 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized={item.imageUrl.startsWith("http")}
                  />
                </div>
              )}
              {!item.imageUrl && (
                <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 sm:h-32 sm:w-32 flex-shrink-0">
                  <span className="text-xs uppercase tracking-[0.3em] text-zinc-400">No media</span>
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-zinc-600">${item.price.toFixed(2)}</p>
                  {item.stockQuantity !== undefined && (
                    <p className={`text-xs mt-1 ${item.stockQuantity === 0 ? "text-red-600" : item.stockQuantity <= 5 ? "text-orange-600" : "text-zinc-500"}`}>
                      {item.stockQuantity === 0 
                        ? "Out of stock" 
                        : item.stockQuantity <= 5 
                        ? `Only ${item.stockQuantity} left` 
                        : `${item.stockQuantity} in stock`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm text-zinc-500">Quantity</label>
                  <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      className="h-8 w-8 rounded-full border border-transparent text-lg hover:bg-zinc-50 transition-colors flex items-center justify-center"
                      type="button"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                      className="h-8 w-8 rounded-full border border-transparent text-lg hover:bg-zinc-50 transition-colors disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent flex items-center justify-center"
                      title={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity ? "Maximum quantity reached" : ""}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  {item.stockQuantity !== undefined && item.quantity >= item.stockQuantity && (
                    <p className="text-xs text-red-600">Maximum quantity reached</p>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <p className="font-semibold mb-2 text-lg">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-white/80 p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <span className="text-xl font-semibold">Total</span>
            <span className="text-3xl font-bold tracking-tight">${getTotal().toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex-1 rounded-full border border-zinc-200 px-6 py-3 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Continue shopping
            </Link>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your cart?")) {
                  clearCart();
                }
              }}
              className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              type="button"
            >
              Clear cart
            </button>
            <button
              onClick={() => router.push("/checkout")}
              className="flex-1 rounded-full border border-zinc-900/10 bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-black transition-colors"
              type="button"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
