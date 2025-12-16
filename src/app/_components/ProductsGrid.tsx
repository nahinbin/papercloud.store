"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/productDb";

interface ProductsGridProps {
  initialProducts: ProductSummary[];
  initialNextCursor: string | null;
  isAdmin: boolean;
}

const BATCH_SIZE = 12;

export default function ProductsGrid({ initialProducts, initialNextCursor, isAdmin }: ProductsGridProps) {
  const [items, setItems] = useState<ProductSummary[]>(initialProducts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const hasMore = Boolean(nextCursor);

  const fetchMore = useCallback(async () => {
    if (!nextCursor || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/home-products?cursor=${nextCursor}&limit=${BATCH_SIZE}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to load more products");
      }
      const data = await res.json();
      setItems((prev) => [...prev, ...(data.products ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (error) {
      // Fail silently but stop spinner
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [nextCursor, isLoading]);

  useEffect(() => {
    // Set up intersection observer for infinite scroll
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore || !loadMoreRef.current) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          fetchMore();
        }
      },
      { rootMargin: "200px" }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchMore, hasMore, isLoading]);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-10 text-center shadow-sm">
        <p className="text-zinc-600">No products available yet.</p>
        {isAdmin && (
          <Link
            href="/admin/products/new"
            className="mt-4 inline-flex rounded-full border border-zinc-900/10 bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Add the first product
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {items.map((product, index) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            prefetch={index < 6}
            className={`group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-white/95 to-zinc-50/80 shadow-sm ring-1 ring-zinc-100/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-zinc-200/90 fade-in-up ${
              product.stockQuantity === 0
                ? "opacity-75"
                : ""
            }`}
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
            }}
          >
            {product.imageUrl ? (
              <div className="relative aspect-[20/21] w-full overflow-hidden bg-zinc-100/80">
                {/* Top-left brand / status pill */}
                <div className="pointer-events-none absolute left-2 top-2 flex gap-1">
                  {product.brand && (
                    <span className="rounded-full bg-black/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/90 shadow-sm">
                      {product.brand}
                    </span>
                  )}
                  {product.stockQuantity === 0 && (
                    <span className="rounded-full bg-red-500/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
                      Sold out
                    </span>
                  )}
                </div>
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  priority={index < 4}
                  loading={index < 4 ? "eager" : "lazy"}
                  fetchPriority={index < 4 ? "high" : "auto"}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105 group-hover:brightness-[1.03]"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
            ) : (
              <div className="flex aspect-[20/21] w-full items-center justify-center bg-[radial-gradient(circle_at_top,_#e5e5e5,_#f7f7f7)]">
                <span className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                  No image
                </span>
              </div>
            )}
            <div className="flex flex-1 flex-col justify-between px-3 pb-3 pt-2.5">
              <div className="space-y-1.5">
                <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 group-hover:text-black">
                  {product.title}
                </h3>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="flex flex-col">
                  <p className="text-lg font-semibold text-zinc-900 leading-tight">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                {typeof product.stockQuantity === "number" && (
                  <div className="flex flex-col items-end text-right">
                    {product.stockQuantity === 0 ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-600 ring-1 ring-red-100">
                        Out of stock
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-zinc-500">
                        {product.stockQuantity} left
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Loading indicator and intersection observer target */}
      {hasMore && (
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
              <span className="text-sm">Loading more products...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

