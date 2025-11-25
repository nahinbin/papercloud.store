"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
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
          const canViewCatalogues = admin || permissions.includes("catalogues.view");
          
          if (!canViewCatalogues) {
            router.push("/admin/unauthorized");
            return;
          }
          
          await Promise.all([fetchCatalogues(), fetchProducts()]);
        } else {
          setIsAdmin(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/admin/unauthorized");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const fetchCatalogues = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/catalogues");
      if (res.ok) {
        const data = await res.json();
        setCatalogues(data.catalogues || []);
      } else {
        setError("Failed to load categories");
      }
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
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
  };

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
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/admin" className="text-zinc-600 hover:text-black underline block mb-3 md:mb-2">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-semibold">Category Tiles</h1>
            <p className="mt-2 text-zinc-600">Curate homepage tiles, assign products, or generate internal category pages.</p>
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
                  <p className="mt-2 text-xs text-zinc-500">Lower numbers show first.</p>
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

        <div className="grid gap-6 md:grid-cols-3">
          {catalogues.map((catalogue) => (
            <div key={catalogue.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              {catalogue.imageUrl ? (
                <div className="relative mb-4 h-32 w-full overflow-hidden rounded-xl bg-zinc-50">
                  <Image
                    src={catalogue.imageUrl}
                    alt={catalogue.title}
                    fill
                    className="object-cover"
                    unoptimized={catalogue.imageUrl.startsWith("http")}
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400">
                  No image
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">{catalogue.isActive ? "Active" : "Hidden"}</p>
                <span className="text-xs text-zinc-500">{catalogue.productIds.length} products</span>
              </div>
              <h3 className="mt-1 text-lg font-semibold">{catalogue.title}</h3>
              {catalogue.slug && (
                <p className="text-xs text-zinc-500">/catalogues/{catalogue.slug}</p>
              )}
              {catalogue.description && <p className="text-sm text-zinc-600 mt-1">{catalogue.description}</p>}
              {catalogue.linkUrl && <p className="mt-2 text-xs text-zinc-500 truncate">{catalogue.linkUrl}</p>}
              {catalogue.content && <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{catalogue.content}</p>}

              <div className="mt-3 flex gap-2 text-xs text-zinc-500">
                {(catalogue.slug || catalogue.linkUrl) && (
                  <Link
                    href={catalogue.linkUrl || `/catalogues/${catalogue.slug || catalogue.id}`}
                    className="underline hover:text-zinc-700"
                    prefetch={false}
                  >
                    View page
                  </Link>
                )}
              </div>

              <div className="mt-4 flex gap-2">
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

