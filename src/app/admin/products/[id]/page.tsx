"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Product } from "@/types/product";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Product not found");
          } else {
            throw new Error("Failed to fetch product");
          }
        } else {
          const data = await res.json();
          setProduct(data.product);
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-red-600">{error || "Product not found"}</p>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="mt-4 rounded border px-4 py-2"
        >
          Back to New Product
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/products/new")}
          className="mb-4 rounded border px-4 py-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">Product Details</h1>
      </div>
      <div className="space-y-4">
        {product.imageUrl && (
          <div>
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full rounded border"
            />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">{product.title}</h2>
          <p className="text-lg font-medium text-gray-700">${product.price.toFixed(2)}</p>
        </div>
        {product.description && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <p className="text-sm text-gray-600">{product.description}</p>
          </div>
        )}
        <div className="text-xs text-gray-500">
          Created: {new Date(product.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

