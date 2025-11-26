"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types/product";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ProductsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (authRes) => {
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.user;
          const permissions = authData.permissions || [];
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          
          // Check permissions - now available from auth response
          const canViewProducts = admin || permissions.includes("products.view");
          setHasAccess(canViewProducts);
          
          if (!canViewProducts) {
            router.push("/admin/unauthorized");
            return;
          }
          
          // Fetch products
          fetch("/api/products")
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                // Sort by order to ensure correct display order
                const sorted = (data.products || []).sort((a: Product, b: Product) => (a.order || 0) - (b.order || 0));
                setProducts(sorted);
              } else {
                setError("Failed to load products");
              }
            })
            .catch(() => setError("Failed to load products"))
            .finally(() => setLoading(false));
        } else {
          setIsAdmin(false);
          setHasAccess(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setHasAccess(false);
        router.push("/admin/unauthorized");
      });
  }, [router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.products || []).sort((a: Product, b: Product) => (a.order || 0) - (b.order || 0));
        setProducts(sorted);
      }
    } catch {
      setError("Failed to load products");
    }
  };

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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Create a custom drag image for better visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      // Find the parent card element
      const cardElement = e.currentTarget.closest('[class*="rounded-2xl"]') as HTMLElement;
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        const dragImage = cardElement.cloneNode(true) as HTMLElement;
        dragImage.style.width = `${rect.width}px`;
        dragImage.style.opacity = "0.9";
        dragImage.style.transform = "rotate(3deg)";
        dragImage.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
        dragImage.style.pointerEvents = "none";
        document.body.appendChild(dragImage);
        dragImage.style.position = "absolute";
        dragImage.style.top = "-1000px";
        e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);
        setTimeout(() => {
          if (document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
          }
        }, 0);
      }
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the element (not just moving to a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = products.findIndex((p) => p.id === draggedId);
    const targetIndex = products.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Create new array with reordered items
    const newProducts = [...products];
    const [removed] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(targetIndex, 0, removed);

    // Update order values based on new positions
    const orders = newProducts.map((product, index) => ({
      id: product.id!,
      order: index,
    }));

    // Optimistically update UI
    setProducts(newProducts.map((product, idx) => ({ ...product, order: idx })));

    // Save to server
    setIsReordering(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });

      if (!res.ok) {
        // Revert on error
        await fetchProducts();
        alert("Failed to update order. Please try again.");
      }
    } catch (error) {
      // Revert on error
      await fetchProducts();
      alert("Failed to update order. Please try again.");
    } finally {
      setIsReordering(false);
      setDraggedId(null);
    }
  };

  if (loading || isAdmin === null || hasAccess === null) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Breadcrumbs className="mb-3 md:mb-2" />
            <h1 className="text-3xl font-semibold">Products</h1>
            <p className="mt-1 text-sm text-zinc-500">Drag and drop products to reorder them</p>
          </div>
          <Link
            href="/admin/products/new"
            className="rounded-full bg-black px-5 py-2 text-white text-sm font-medium hover:bg-zinc-800"
          >
            Add Product
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isReordering && (
          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Updating order...</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.filter(p => p.id).map((product, index) => {
            const isDraft = product.isDraft ?? false;
            return (
            <div
              key={product.id}
              className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 ${
                isDraft ? "border-amber-300 bg-amber-50/30" : ""
              } ${
                draggedId === product.id
                  ? "opacity-40 scale-95 cursor-grabbing z-50 rotate-2 shadow-2xl"
                  : dragOverId === product.id
                  ? "border-blue-500 border-2 scale-[1.03] shadow-xl bg-blue-50 ring-2 ring-blue-200 ring-offset-2"
                  : "border-zinc-200 hover:shadow-lg hover:border-zinc-300"
              } ${isReordering && draggedId !== product.id ? "pointer-events-none opacity-40" : ""}`}
            >
              {/* Draft Badge */}
              {isDraft && (
                <div className="absolute left-2 top-2 z-20 flex items-center gap-1.5 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Draft
                </div>
              )}
              {/* Elegant Drag Handle - Top right corner */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, product.id!)}
                onDragEnd={handleDragEnd}
                className="absolute right-2 top-2 z-10 flex h-10 w-10 cursor-grab active:cursor-grabbing items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-zinc-200 hover:bg-white hover:shadow-md hover:scale-110 hover:border-zinc-300 transition-all duration-200 opacity-100"
                title="Drag to reorder"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-zinc-600"
                >
                  <path
                    d="M5 4.5C5.55228 4.5 6 4.05228 6 3.5C6 2.94772 5.55228 2.5 5 2.5C4.44772 2.5 4 2.94772 4 3.5C4 4.05228 4.44772 4.5 5 4.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M5 9.5C5.55228 9.5 6 9.05228 6 8.5C6 7.94772 5.55228 7.5 5 7.5C4.44772 7.5 4 7.94772 4 8.5C4 9.05228 4.44772 9.5 5 9.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M5 13.5C5.55228 13.5 6 13.0523 6 12.5C6 11.9477 5.55228 11.5 5 11.5C4.44772 11.5 4 11.9477 4 12.5C4 13.0523 4.44772 13.5 5 13.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M11 4.5C11.5523 4.5 12 4.05228 12 3.5C12 2.94772 11.5523 2.5 11 2.5C10.4477 2.5 10 2.94772 10 3.5C10 4.05228 10.4477 4.5 11 4.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M11 9.5C11.5523 9.5 12 9.05228 12 8.5C12 7.94772 11.5523 7.5 11 7.5C10.4477 7.5 10 7.94772 10 8.5C10 9.05228 10.4477 9.5 11 9.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M11 13.5C11.5523 13.5 12 13.0523 12 12.5C12 11.9477 11.5523 11.5 11 11.5C10.4477 11.5 10 11.9477 10 12.5C10 13.0523 10.4477 13.5 11 13.5Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              {/* Drop zone indicator - appears when dragging over */}
              {dragOverId === product.id && draggedId !== product.id && (
                <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center z-0">
                  <div className="flex flex-col items-center gap-2 text-blue-600">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="animate-bounce"
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-xs font-medium">Move here</span>
                  </div>
                </div>
              )}

              {/* Drop zone for the card */}
              <div
                onDragOver={(e) => handleDragOver(e, product.id!)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, product.id!)}
                className={`relative ${draggedId === product.id ? "pointer-events-none" : ""}`}
              >
                {/* Product Image */}
                {product.imageUrl ? (
                  <div className={`relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-zinc-50 transition-transform duration-200 ${
                    draggedId === product.id ? "scale-95" : dragOverId === product.id ? "scale-105" : ""
                  }`}>
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                      unoptimized={product.imageUrl.startsWith("http")}
                    />
                  </div>
                ) : (
                  <div className={`mb-4 flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400 transition-transform duration-200 ${
                    draggedId === product.id ? "scale-95" : dragOverId === product.id ? "scale-105" : ""
                  }`}>
                    No image
                  </div>
                )}

                {/* Product Info */}
                <div className="space-y-2">
                  {product.brand && (
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{product.brand}</p>
                  )}
                  <h3 className="text-lg font-semibold text-zinc-900 line-clamp-2">{product.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-zinc-900">${product.price.toFixed(2)}</p>
                    <span className="text-xs text-zinc-500">Order: {product.order ?? 0}</span>
                  </div>
                  {product.stockQuantity !== undefined && (
                    <p className="text-sm text-zinc-600">
                      Stock: <span className={product.stockQuantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {product.stockQuantity}
                      </span>
                    </p>
                  )}
                  {product.category && (
                    <p className="text-xs text-zinc-500">Category: {product.category}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={isDraft ? `/admin/products/new?draft=${product.id}` : `/admin/products/${product.id}/edit`}
                    className="flex-1 rounded-full border px-3 py-1.5 text-center text-sm font-medium hover:bg-zinc-50"
                  >
                    {isDraft ? "Continue" : "Edit"}
                  </Link>
                  <button
                    onClick={() => product.id && handleDelete(product.id)}
                    className="flex-1 rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {products.length === 0 && !loading && (
          <div className="py-12 text-center text-zinc-500">
            <p className="mb-4">No products yet. Create one to get started.</p>
            <Link
              href="/admin/products/new"
              className="inline-block rounded-full bg-black px-5 py-2 text-white text-sm font-medium hover:bg-zinc-800"
            >
              Add First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
