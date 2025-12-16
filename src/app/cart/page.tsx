"use client";

import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart, isLoading } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsEntering(true);
    const timer = setTimeout(() => setIsEntering(false), 800);
    return () => clearTimeout(timer);
  }, [pathname]);

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
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-3xl border border-zinc-100 bg-white/80 p-10 text-center shadow-sm">
            <h1 className="mb-2 text-sm uppercase tracking-[0.3em] text-zinc-400">Cart</h1>
            <h2 className="mb-4 text-3xl font-semibold">Shopping cart</h2>
            <p className="mb-6 text-zinc-600">Your cart is empty.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-zinc-900/10 bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
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
    <div className={`min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900 pb-24 ${isEntering ? "cart-page-enter" : ""}`}>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Cart</p>
        </div>

        <div className="mb-8 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="relative flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:shadow-md"
            >
              <button
                onClick={() => handleRemove(item.productId)}
                className="absolute right-3 top-3 text-[11px] font-semibold text-red-500 underline-offset-4 transition-colors hover:text-red-600 hover:underline"
                type="button"
              >
                Remove
              </button>
              {item.imageUrl ? (
                <div className="relative -m-3 mr-3 flex-shrink-0 self-stretch w-24 overflow-hidden rounded-l-2xl">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized={item.imageUrl.startsWith("http")}
                  />
                </div>
              ) : (
                <div className="flex -m-3 mr-3 w-24 flex-shrink-0 items-center justify-center self-stretch rounded-l-2xl border border-dashed border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-[0.3em] text-zinc-400">
                  No media
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{item.title}</h3>
                  {item.stockQuantity !== undefined && (
                    <p
                      className={`text-xs ${item.stockQuantity === 0 ? "text-red-600" : item.stockQuantity <= 5 ? "text-orange-600" : "text-zinc-500"}`}
                    >
                      {item.stockQuantity === 0
                        ? "Out of stock"
                        : item.stockQuantity <= 5
                        ? `Only ${item.stockQuantity} left`
                        : `${item.stockQuantity} in stock`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-l-lg text-base text-zinc-600 transition-colors hover:bg-zinc-50"
                      type="button"
                    >
                      −
                    </button>
                    <span className="w-9 text-center text-sm font-semibold text-zinc-900">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                      className="flex h-8 w-8 items-center justify-center rounded-r-lg text-base text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      title={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity ? "Maximum quantity reached" : ""}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-3 right-3">
                <p className="text-base font-semibold text-zinc-900">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500">Total</span>
              <span className="text-xl font-bold text-zinc-900">{formatCurrency(getTotal())}</span>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="rounded-lg bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
              type="button"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
