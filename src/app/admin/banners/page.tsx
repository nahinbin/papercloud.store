"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Banner {
  id: string;
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  desktopImageUrl?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

const sortBannersByOrder = (items: Banner[]) =>
  [...items].sort((a, b) => {
    if (a.order === b.order) {
      return a.createdAt - b.createdAt;
    }
    return a.order - b.order;
  });

const shouldSkipOptimization = (src?: string | null) =>
  Boolean(src && (src.startsWith("http") || src.startsWith("data:")));

export default function BannersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    order: "0",
  });
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);
  const [desktopImagePreview, setDesktopImagePreview] = useState<string | null>(null);
  const [mobileImageCleared, setMobileImageCleared] = useState(false);
  const [desktopImageCleared, setDesktopImageCleared] = useState(false);
  const [orderDraft, setOrderDraft] = useState<Banner[]>([]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch auth (which now includes permissions), then banners if authorized
    fetch("/api/auth/me")
      .then(async (authRes) => {
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.user;
          const permissions = authData.permissions || [];
          const admin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
          setIsAdmin(admin);
          
          // Check permissions - now available from auth response
          const canViewBanners = admin || permissions.includes("banners.view");
          
          if (!canViewBanners) {
            router.push("/admin/unauthorized");
            return;
          }
          
          // Fetch banners after auth check passes
          fetchBanners();
        } else {
          setIsAdmin(false);
          router.push("/admin/unauthorized");
        }
      })
      .catch(() => {
        setIsAdmin(false);
        router.push("/admin/unauthorized");
      });
  }, [router]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBanners(sortBannersByOrder(data.banners || []));
      } else {
        setError("Failed to load banners");
      }
    } catch (err) {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOrderDraft(sortBannersByOrder(banners).map((banner) => ({ ...banner })));
    setOrderDirty(false);
  }, [banners]);

  useEffect(() => {
    if (!editingId) {
      setForm((prev) => ({ ...prev, order: orderDraft.length.toString() }));
    }
  }, [editingId, orderDraft.length]);

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMobileImageFile(file);
    setMobileImageCleared(false);
    if (!file) {
      setMobileImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMobileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDesktopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDesktopImageFile(file);
    setDesktopImageCleared(false);
    if (!file) {
      setDesktopImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDesktopImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearMobileImage = () => {
    setMobileImageFile(null);
    setMobileImagePreview(null);
    setMobileImageCleared(true);
  };

  const clearDesktopImage = () => {
    setDesktopImageFile(null);
    setDesktopImagePreview(null);
    setDesktopImageCleared(true);
  };

  const reorderByIndex = (list: Banner[], fromIndex: number, toIndex: number) => {
    const updated = [...list];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated.map((item, index) => ({ ...item, order: index }));
  };

  const moveBannerInDraft = (id: string, direction: "up" | "down") => {
    setOrderDraft((prev) => {
      const currentIndex = prev.findIndex((banner) => banner.id === id);
      if (currentIndex === -1) return prev;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      setOrderDirty(true);
      return reorderByIndex(prev, currentIndex, targetIndex);
    });
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, overId: string) => {
    event.preventDefault();
    if (!draggingId || draggingId === overId) return;
    setOrderDraft((prev) => {
      const fromIndex = prev.findIndex((banner) => banner.id === draggingId);
      const toIndex = prev.findIndex((banner) => banner.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      setOrderDirty(true);
      return reorderByIndex(prev, fromIndex, toIndex);
    });
  };

  const handleDragEnd = () => setDraggingId(null);

  const resetOrderDraft = () => {
    setOrderDraft(sortBannersByOrder(banners).map((banner) => ({ ...banner })));
    setOrderDirty(false);
  };

  const saveOrderChanges = async () => {
    if (!orderDirty) return;
    setSavingOrder(true);
    try {
      const updates = orderDraft.filter((draft) => {
        const original = banners.find((banner) => banner.id === draft.id);
        return original?.order !== draft.order;
      });

      await Promise.all(
        updates.map((draft) =>
          fetch(`/api/admin/banners/${draft.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: draft.order }),
            cache: "no-store",
          })
        )
      );

      if (updates.length > 0) {
        await fetchBanners();
      } else {
        setOrderDirty(false);
      }
    } catch (err) {
      alert("Failed to save banner order");
    } finally {
      setSavingOrder(false);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: Record<string, any> = {};

      if (mobileImageFile) {
        const dataUrl = await readFileAsDataUrl(mobileImageFile);
        payload.mobileImageData = dataUrl;
        payload.mobileImageMimeType = mobileImageFile.type;
      } else if (editingId && mobileImageCleared) {
        payload.mobileImageData = null;
        payload.mobileImageMimeType = null;
      }

      if (desktopImageFile) {
        const dataUrl = await readFileAsDataUrl(desktopImageFile);
        payload.desktopImageData = dataUrl;
        payload.desktopImageMimeType = desktopImageFile.type;
      } else if (editingId && desktopImageCleared) {
        payload.desktopImageData = null;
        payload.desktopImageMimeType = null;
      }

      const parsedOrder = Number(form.order);
      const normalizedOrder = Number.isFinite(parsedOrder) ? Math.max(0, Math.floor(parsedOrder)) : orderDraft.length;

      payload.title = form.title || undefined;
      payload.order = normalizedOrder;

      if (!editingId) {
        payload.isActive = true;
      }

      const url = editingId 
        ? `/api/admin/banners/${editingId}`
        : "/api/admin/banners";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (res.ok) {
        await fetchBanners();
        resetForm();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save banner");
      }
    } catch (err) {
      alert("Failed to save banner");
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      order: banner.order.toString(),
    });
    setMobileImageFile(null);
    setDesktopImageFile(null);
    setMobileImagePreview(banner.mobileImageUrl || banner.imageUrl || null);
    setDesktopImagePreview(banner.desktopImageUrl || banner.imageUrl || null);
    setMobileImageCleared(false);
    setDesktopImageCleared(false);
    setShowAddForm(true);
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchBanners();
      } else {
        alert("Failed to delete banner");
      }
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  const resetForm = () => {
    setForm({ title: "", order: orderDraft.length.toString() });
    setMobileImageFile(null);
    setDesktopImageFile(null);
    setMobileImagePreview(null);
    setDesktopImagePreview(null);
    setMobileImageCleared(false);
    setDesktopImageCleared(false);
    setEditingId(null);
    setShowAddForm(false);
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
          <Breadcrumbs className="mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Banner Management</h1>
              <p className="mt-2 text-zinc-600">Manage homepage banners</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
            >
              {showAddForm ? "Cancel" : "Add Banner"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mb-8 p-6 border-2 border-zinc-200 rounded-lg bg-white">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Banner" : "Add New Banner"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1">
                  Banner name
                </label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Homepage hero"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Only visible inside this admin page so you can quickly identify each banner.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg border border-zinc-200/70 p-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-zinc-900">
                      Mobile banner · 750 × 392
                    </label>
                    {mobileImagePreview && (
                      <button
                        type="button"
                        onClick={clearMobileImage}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileImageChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-zinc-500">
                    Perfect for phones. Keep copy large enough to survive cropping.
                  </p>
                  {mobileImagePreview && (
                    <div className="relative w-full h-36 rounded border overflow-hidden bg-zinc-50">
                      <Image
                        src={mobileImagePreview}
                        alt="Mobile banner preview"
                        fill
                        className="object-cover"
                        unoptimized={shouldSkipOptimization(mobileImagePreview)}
                      />
                    </div>
                  )}
                  {!mobileImagePreview && editingId && (
                    <p className="text-xs text-zinc-500">
                      Leave this empty to keep the current mobile creative.
                    </p>
                  )}
                </div>

                <div className="space-y-2 rounded-lg border border-zinc-200/70 p-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-zinc-900">
                      Desktop banner · 1904 × 382
                    </label>
                    {desktopImagePreview && (
                      <button
                        type="button"
                        onClick={clearDesktopImage}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDesktopImageChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-zinc-500">
                    Ultra-wide hero for big screens. Center the focal point so mobile crops nicely.
                  </p>
                  {desktopImagePreview && (
                    <div className="relative w-full h-36 rounded border overflow-hidden bg-zinc-50">
                      <Image
                        src={desktopImagePreview}
                        alt="Desktop banner preview"
                        fill
                        className="object-cover"
                        unoptimized={shouldSkipOptimization(desktopImagePreview)}
                      />
                    </div>
                  )}
                  {!desktopImagePreview && editingId && (
                    <p className="text-xs text-zinc-500">
                      Leave this empty to keep the current desktop creative.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1">
                  Display order
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full border rounded px-3 py-2"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  placeholder={orderDraft.length.toString()}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Lower numbers appear first. Leave it blank to drop the banner at the end or simply drag banners in
                  the ordering list.
                </p>
              </div>

              <div className="flex flex-col gap-2 md:flex-row">
                <button
                  type="submit"
                  className="flex-1 rounded bg-black px-4 py-2 text-white hover:bg-zinc-800"
                >
                  {editingId ? "Update Banner" : "Create Banner"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded border px-4 py-2 hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => {
            const previewImage = banner.desktopImageUrl || banner.mobileImageUrl || banner.imageUrl;
            const unoptimizedPreview = shouldSkipOptimization(previewImage);
            return (
              <div key={banner.id} className="border rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                  <span className="font-semibold">#{index + 1}</span>
                  <span className={banner.isActive ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {banner.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                <div className="mb-3">
                  {previewImage ? (
                    <div className="relative w-full h-32 rounded overflow-hidden bg-gray-100">
                      <Image
                        src={previewImage}
                        alt={banner.title || "Banner"}
                        fill
                        className="object-cover"
                        unoptimized={unoptimizedPreview}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>

                <div className="text-sm text-zinc-600 space-y-1">
                  <p className="font-medium text-zinc-900">
                    {banner.title || "No name set"}
                    <span className="ml-1 text-xs text-zinc-500">(admin only)</span>
                  </p>
                  <p>Order value: {banner.order}</p>
                  {banner.linkUrl && (
                    <p className="text-xs truncate text-zinc-500">Link: {banner.linkUrl}</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(banner)}
                    className="flex-1 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="flex-1 rounded border border-red-300 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {orderDraft.length > 1 && (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Smart ordering</h2>
                <p className="text-sm text-zinc-500">Drag rows or use the arrows to sequence banners without typing numbers.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetOrderDraft}
                  disabled={!orderDirty || savingOrder}
                  className="rounded border px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={saveOrderChanges}
                  disabled={!orderDirty || savingOrder}
                  className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
                >
                  {savingOrder ? "Saving..." : "Save order"}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {orderDraft.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 bg-white transition-colors ${
                    draggingId === banner.id ? "border-black shadow-sm" : "border-zinc-200"
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(banner.id)}
                  onDragOver={(event) => handleDragOver(event, banner.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">{banner.title || "Untitled banner"}</p>
                    <p className="text-xs text-zinc-500">Current order value: {banner.order}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveBannerInDraft(banner.id, "up")}
                      disabled={index === 0 || savingOrder}
                      className="rounded border px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBannerInDraft(banner.id, "down")}
                      disabled={index === orderDraft.length - 1 || savingOrder}
                      className="rounded border px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Changes are staged locally. Click <strong>Save order</strong> to sync the new sequence to the storefront.
            </p>
          </div>
        )}

        {banners.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-zinc-600 mb-4">No banners yet</p>
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="inline-block rounded bg-black px-4 py-2 text-white"
            >
              Add First Banner
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

