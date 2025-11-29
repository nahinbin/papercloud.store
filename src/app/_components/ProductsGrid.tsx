"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/productDb";

interface ProductsGridProps {
  products: ProductSummary[];
  isAdmin: boolean;
}

const INITIAL_BATCH_SIZE = 12;
const BATCH_SIZE = 8;

export default function ProductsGrid({ products, isAdmin }: ProductsGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

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
          setIsLoading(true);
          // Small delay for smooth animation
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, products.length));
            setIsLoading(false);
          }, 200);
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
  }, [hasMore, isLoading, products.length]);

  if (products.length === 0) {
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {visibleProducts.map((product, index) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            prefetch={index < 6}
            className={`group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg fade-in-up ${
              product.stockQuantity === 0 
                ? "border-zinc-200 bg-zinc-50/50 opacity-75" 
                : "border-zinc-100 bg-white/70"
            }`}
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
            }}
          >
            {product.imageUrl ? (
              <div className="relative aspect-[20/21] w-full overflow-hidden bg-zinc-100">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  priority={index < 4}
                  loading={index < 4 ? "eager" : "lazy"}
                  fetchPriority={index < 4 ? "high" : "auto"}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>
            ) : (
              <div className="flex aspect-[20/21] w-full items-center justify-center border border-dashed border-zinc-200 bg-zinc-50">
                <span className="text-sm text-zinc-400">No image</span>
              </div>
            )}
            <div className="space-y-2 px-3 py-2.5">
              {product.brand && (
                <p className="text-xs uppercase tracking-[0.23em] text-zinc-400">{product.brand}</p>
              )}
              <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900 group-hover:text-black">
                {product.title}
              </h3>
              <p className="text-xl font-bold text-zinc-900">${product.price.toFixed(2)}</p>
              {typeof product.stockQuantity === "number" && (
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-medium ${product.stockQuantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
                  </p>
                  {product.stockQuantity === 0 && (
                    <span className="text-[10px] uppercase tracking-wider text-red-600 font-semibold">Sold Out</span>
                  )}
                </div>
              )}
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

