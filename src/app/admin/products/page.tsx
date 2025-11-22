"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          const user = data.user;
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          if (!admin) {
            router.push("/");
            return;
          }
          // Fetch products
          fetch("/api/products")
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
              } else {
                setError("Failed to load products");
              }
            })
            .catch(() => setError("Failed to load products"))
            .finally(() => setLoading(false));
        } else {
          setIsAdmin(false);
          router.push("/");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/");
      });
  }, [router]);

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId));
      } else {
        alert("Failed to delete product");
      }
    } catch (err) {
      alert("Failed to delete product");
    }
  };


  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <Link href="/admin" className="text-zinc-600 hover:text-black underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Product Management</h1>
              <p className="mt-2 text-zinc-600">Manage all products</p>
            </div>
            <Link
              href="/admin/products/new"
              className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
            >
              Add Product
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter(p => p.id).map((product) => (
            <div key={product.id} className="border rounded-lg p-4">
              {product.brand && (
                <p className="text-sm text-zinc-500 mb-1">{product.brand}</p>
              )}
              <h3 className="font-semibold">{product.title}</h3>
              <p className="mt-1 text-lg font-medium">${product.price.toFixed(2)}</p>
              <p className="mt-1 text-sm text-zinc-600">
                Stock: {product.stockQuantity ?? 0}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="flex-1 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50 text-center"
                >
                  Edit
                </Link>
                <button
                  onClick={() => product.id && handleDelete(product.id)}
                  className="flex-1 rounded border border-red-300 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">No products yet</p>
            <Link
              href="/admin/products/new"
              className="inline-block rounded bg-black px-4 py-2 text-white"
            >
              Add First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

