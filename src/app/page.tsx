"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Check auth status
    fetch("/api/auth/me")
      .then(async (r) => setIsAuthed(r.ok))
      .catch(() => setIsAuthed(false));

    // Fetch products
    fetch("/api/products")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold">PaperCloud Store</h1>
        {isAuthed === true && (
          <p className="mt-2 text-zinc-600">Welcome back! Browse our products below.</p>
        )}
        {isAuthed === false && (
          <p className="mt-2 text-zinc-600">Browse our products. <Link href="/login" className="underline">Login</Link> to add new products.</p>
        )}

        {loading ? (
          <p className="mt-8 text-zinc-600">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="mt-8">
            <p className="text-zinc-600">No products available yet.</p>
            {isAuthed && (
              <Link href="/admin/products/new" className="mt-4 inline-block rounded bg-black px-4 py-2 text-white">
                Add First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/admin/products/${product.id}`}
                className="group rounded border p-4 transition-shadow hover:shadow-lg"
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="mb-3 h-48 w-full rounded object-cover"
                  />
                )}
                <h3 className="font-semibold group-hover:underline">{product.title}</h3>
                <p className="mt-1 text-lg font-medium">${product.price.toFixed(2)}</p>
                {product.description && (
                  <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{product.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
