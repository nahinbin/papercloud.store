"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface Catalogue {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  productIds: string[];
}

interface ProductOption {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
}

export default function CataloguePage() {
  const { hasAccess, isChecking } = useAdminAccess(["catalogues.view"]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    imageUrl: "",
    linkUrl: "",
    order: "0",
    isActive: true,
    productIds: [] as string[],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const fetchCatalogues = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/catalogues");
      if (res.ok) {
        const data = await res.json();
        // Sort by order to ensure correct display order
        const sorted = (data.catalogues || []).sort((a: Catalogue, b: Catalogue) => a.order - b.order);
        setCatalogues(sorted);
      } else {
        setError("Failed to load categories");
      }
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch("/api/admin/catalogues/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      Promise.all([fetchCatalogues(), fetchProducts()]).catch((err) => {
        console.error("Failed to load catalogue data", err);
      });
    }
  }, [hasAccess, fetchCatalogues, fetchProducts]);

  useEffect(() => {
    if (hasAccess === false) {
      setLoading(false);
      setLoadingProducts(false);
    }
  }, [hasAccess]);

  const resetForm = () => {
    setForm({
      title: "",
      slug: "",
      description: "",
      content: "",
      imageUrl: "",
      linkUrl: "",
      order: "0",
      isActive: true,
      productIds: [],
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let imageData: string | undefined;
    let imageMimeType: string | undefined;

    if (imageFile) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      imageData = dataUrl;
      imageMimeType = imageFile.type;
    }

    const payload: Record<string, unknown> = {
      title: form.title,
      slug: form.slug || undefined,
      description: form.description || undefined,
      content: form.content || undefined,
      imageUrl: form.imageUrl || undefined,
      linkUrl: form.linkUrl || undefined,
      order: parseInt(form.order, 10) || 0,
      isActive: form.isActive,
      productIds: form.productIds,
    };

    if (imageData) {
      payload.imageData = imageData;
      payload.imageMimeType = imageMimeType;
    }

    const url = editingId ? `/api/admin/catalogues/${editingId}` : "/api/admin/catalogues";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchCatalogues();
      resetForm();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to save category");
    }
  };

  const handleEdit = (catalogue: Catalogue) => {
    setEditingId(catalogue.id);
    setForm({
      title: catalogue.title,
      slug: catalogue.slug || "",
      description: catalogue.description || "",
      content: catalogue.content || "",
      imageUrl: catalogue.imageUrl?.startsWith("http") ? catalogue.imageUrl : "",
      linkUrl: catalogue.linkUrl || "",
      order: catalogue.order.toString(),
      isActive: catalogue.isActive,
      productIds: catalogue.productIds || [],
    });
    setImageFile(null);
    setImagePreview(catalogue.imageUrl || null);
    setShowForm(true);
  };

  const toggleProductSelection = (productId: string) => {
    setForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists ? prev.productIds.filter((id) => id !== productId) : [...prev.productIds, productId],
      };
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/catalogues/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchCatalogues();
    } else {
      alert("Failed to delete category");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragEnd = () => {
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

    const draggedIndex = catalogues.findIndex((c) => c.id === draggedId);
    const targetIndex = catalogues.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Create new array with reordered items
    const newCatalogues = [...catalogues];
    const [removed] = newCatalogues.splice(draggedIndex, 1);
    newCatalogues.splice(targetIndex, 0, removed);

    // Update order values based on new positions
    const orders = newCatalogues.map((catalogue, index) => ({
      id: catalogue.id,
      order: index,
    }));

    // Optimistically update UI
    setCatalogues(newCatalogues.map((cat, idx) => ({ ...cat, order: idx })));

    // Save to server
    setIsReordering(true);
    try {
      const res = await fetch("/api/admin/catalogues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });

      if (!res.ok) {
        // Revert on error
        await fetchCatalogues();
        alert("Failed to update order. Please try again.");
      }
    } catch {
      // Revert on error
      await fetchCatalogues();
      alert("Failed to update order. Please try again.");
    } finally {
      setIsReordering(false);
      setDraggedId(null);
    }
  };

  if (loading || isChecking || hasAccess === null) {
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
            <h1 className="text-3xl font-semibold">Category Tiles</h1>
            <p className="mt-1 text-sm text-zinc-500">Drag and drop categories to reorder them</p>
          </div>
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="rounded-full bg-black px-5 py-2 text-white text-sm font-medium hover:bg-zinc-800"
          >
            {showForm ? "Close form" : "Add category"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit category" : "New category"}</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-zinc-700">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  placeholder="e.g. Stationery"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="e.g. Stationery"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Slug (optional)</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="stationery"
                  />
                  <p className="mt-1 text-xs text-zinc-500">Used for the internal category page URL: /catalogues/[slug]</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={2}
                  placeholder="Short supporting copy"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Page content (optional)</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                  rows={4}
                  placeholder="Additional copy for the internal category page."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Upload square image</label>
                  <input type="file" accept="image/*" className="mt-1 w-full rounded-lg border px-3 py-2" onChange={handleImageChange} />
                  <p className="mt-2 text-xs text-zinc-500">Recommended 400×400px PNG/JPG.</p>
                  {imagePreview && (
                    <div className="mt-2 h-32 w-32 rounded-xl border bg-zinc-50 relative overflow-hidden">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Image URL (optional)</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="https://..."
                  />
                  <p className="mt-2 text-xs text-zinc-500">Use this if the image is hosted elsewhere.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700">Link URL</label>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    placeholder="/products?category=stationery"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700">Display order</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                  <p className="mt-2 text-xs text-zinc-500">Lower numbers show first. You can also drag and drop categories to reorder them.</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700">Assign products (optional)</label>
                <div className="mt-1 rounded-2xl border border-zinc-200 max-h-64 overflow-y-auto">
                  {loadingProducts ? (
                    <p className="px-4 py-3 text-sm text-zinc-500">Loading products...</p>
                  ) : products.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-zinc-500">No products available. Add some first.</p>
                  ) : (
                    products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 border-b border-zinc-100 px-4 py-2 text-sm last:border-b-0 hover:bg-zinc-50"
                      >
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={form.productIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                        />
                        <span className="flex-1">
                          {product.title}
                          <span className="ml-2 text-xs text-zinc-500">${product.price.toFixed(2)}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">These products will appear on the category’s internal page.</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-zinc-700">Status</label>
                <select
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                  className="rounded-lg border px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Hidden</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="flex-1 rounded-full bg-black px-4 py-2 text-white font-semibold hover:bg-zinc-800">
                  {editingId ? "Update category" : "Create category"}
                </button>
                <button type="button" onClick={resetForm} className="rounded-full border px-4 py-2 font-semibold hover:bg-zinc-50">
                  Cancel
                </button>
              </div>
            </form>
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

        <div className="grid gap-6 md:grid-cols-3">
          {catalogues.map((catalogue) => (
            <div
              key={catalogue.id}
              className={`group relative rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 ${
                draggedId === catalogue.id
                  ? "opacity-40 scale-95 cursor-grabbing z-50 rotate-2 shadow-2xl"
                  : dragOverId === catalogue.id
                  ? "border-blue-500 border-2 scale-[1.03] shadow-xl bg-blue-50 ring-2 ring-blue-200 ring-offset-2"
                  : "border-zinc-200 hover:shadow-lg hover:border-zinc-300"
              } ${isReordering && draggedId !== catalogue.id ? "pointer-events-none opacity-40" : ""}`}
            >
              {/* Elegant Drag Handle - Top right corner */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, catalogue.id)}
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
              {dragOverId === catalogue.id && draggedId !== catalogue.id && (
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
                onDragOver={(e) => handleDragOver(e, catalogue.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, catalogue.id)}
                className={`relative ${draggedId === catalogue.id ? "pointer-events-none" : ""}`}
              >
                {catalogue.imageUrl ? (
                  <div className={`relative mb-4 h-32 w-full overflow-hidden rounded-xl bg-zinc-50 transition-transform duration-200 ${
                    draggedId === catalogue.id ? "scale-95" : dragOverId === catalogue.id ? "scale-105" : ""
                  }`}>
                    <Image
                      src={catalogue.imageUrl}
                      alt={catalogue.title}
                      fill
                      className="object-cover"
                      unoptimized={catalogue.imageUrl.startsWith("http")}
                    />
                  </div>
                ) : (
                  <div className={`mb-4 flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400 transition-transform duration-200 ${
                    draggedId === catalogue.id ? "scale-95" : dragOverId === catalogue.id ? "scale-105" : ""
                  }`}>
                    No image
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{catalogue.isActive ? "Active" : "Hidden"}</p>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500">Order: {catalogue.order}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{catalogue.productIds.length} products</span>
                </div>
                <h3 className="mt-1 text-lg font-semibold">{catalogue.title}</h3>
                {catalogue.slug && (
                  <p className="text-xs text-zinc-500">/catalogues/{catalogue.slug}</p>
                )}
                {catalogue.description && <p className="text-sm text-zinc-600 mt-1">{catalogue.description}</p>}
                {catalogue.linkUrl && <p className="mt-2 text-xs text-zinc-500 truncate">{catalogue.linkUrl}</p>}
                {catalogue.content && <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{catalogue.content}</p>}

                <div className="mt-3 flex gap-2 text-xs text-zinc-500" onClick={(e) => e.stopPropagation()}>
                  {(catalogue.slug || catalogue.linkUrl) && (
                    <Link
                      href={catalogue.linkUrl || `/catalogues/${catalogue.slug || catalogue.id}`}
                      className="underline hover:text-zinc-700"
                      prefetch={false}
                      onClick={(e) => e.stopPropagation()}
                    >
                      View page
                    </Link>
                  )}
                </div>

                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleEdit(catalogue)}
                    className="flex-1 rounded-full border px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(catalogue.id)}
                    className="flex-1 rounded-full border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {catalogues.length === 0 && !loading && (
          <div className="py-12 text-center text-zinc-500">
            No categories yet. Create one to fill the homepage row.
          </div>
        )}
      </div>
    </div>
  );
}

