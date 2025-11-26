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
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

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

  // Drag and drop handlers for banner cards (direct reordering)
  const handleCardDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Create a custom drag image for better visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      // Find the parent card element
      const cardElement = e.currentTarget.closest('[class*="rounded-xl"]') as HTMLElement;
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

  const handleCardDragEnd = (e: React.DragEvent) => {
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleCardDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (draggingId && draggingId !== id) {
      setDragOverId(id);
    }
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the element (not just moving to a child)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverId(null);
    }
  };

  const handleCardDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);

    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const draggedIndex = banners.findIndex((b) => b.id === draggingId);
    const targetIndex = banners.findIndex((b) => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggingId(null);
      return;
    }

    // Create new array with reordered items
    const newBanners = [...banners];
    const [removed] = newBanners.splice(draggedIndex, 1);
    newBanners.splice(targetIndex, 0, removed);

    // Update order values based on new positions
    const orders = newBanners.map((banner, index) => ({
      id: banner.id,
      order: index,
    }));

    // Optimistically update UI
    setBanners(newBanners.map((banner, idx) => ({ ...banner, order: idx })));

    // Save to server
    setIsReordering(true);
    try {
      await Promise.all(
        orders.map((item) =>
          fetch(`/api/admin/banners/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: item.order }),
            cache: "no-store",
          })
        )
      );

      await fetchBanners();
    } catch (error) {
      // Revert on error
      await fetchBanners();
      alert("Failed to update order. Please try again.");
    } finally {
      setIsReordering(false);
      setDraggingId(null);
    }
  };

  // Drag and drop handlers for ordering section (draft system)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    // Create a custom drag image for better visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      // Find the parent card element
      const cardElement = e.currentTarget.closest('[class*="rounded-lg"]') as HTMLElement;
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
    setDraggingId(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (draggingId && draggingId !== overId) {
      setDragOverId(overId);
    setOrderDraft((prev) => {
      const fromIndex = prev.findIndex((banner) => banner.id === draggingId);
      const toIndex = prev.findIndex((banner) => banner.id === overId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      setOrderDirty(true);
      return reorderByIndex(prev, fromIndex, toIndex);
    });
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

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      return;
    }

    const fromIndex = orderDraft.findIndex((banner) => banner.id === draggingId);
    const toIndex = orderDraft.findIndex((banner) => banner.id === targetId);
    
    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null);
      return;
    }

    setOrderDirty(true);
    setOrderDraft(reorderByIndex(orderDraft, fromIndex, toIndex));
    setDraggingId(null);
  };

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
              <p className="mt-1 text-sm text-zinc-500">💡 Drag and drop banners to reorder them. Lower order numbers appear first.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner, index) => {
            const previewImage = banner.desktopImageUrl || banner.mobileImageUrl || banner.imageUrl;
            const unoptimizedPreview = shouldSkipOptimization(previewImage);
            return (
              <div
                key={banner.id}
                className={`group relative rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 ${
                  draggingId === banner.id
                    ? "opacity-40 scale-95 cursor-grabbing z-50 rotate-2 shadow-2xl"
                    : dragOverId === banner.id
                    ? "border-blue-500 border-2 scale-[1.03] shadow-xl bg-blue-50 ring-2 ring-blue-200 ring-offset-2"
                    : "border-zinc-200 hover:shadow-lg hover:border-zinc-300"
                } ${isReordering && draggingId !== banner.id ? "pointer-events-none opacity-40" : ""}`}
              >
                {/* Elegant Drag Handle - Top right corner */}
                <div
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, banner.id)}
                  onDragEnd={handleCardDragEnd}
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
                {dragOverId === banner.id && draggingId !== banner.id && (
                  <div className="absolute inset-0 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 flex items-center justify-center z-0">
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
                  onDragOver={(e) => handleCardDragOver(e, banner.id)}
                  onDragLeave={handleCardDragLeave}
                  onDrop={(e) => handleCardDrop(e, banner.id)}
                  className={`relative ${draggingId === banner.id ? "pointer-events-none" : ""}`}
                >
                <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                  <span className="font-semibold">#{index + 1}</span>
                  <span className={banner.isActive ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                    {banner.isActive ? "Live" : "Hidden"}
                  </span>
                </div>
                  <div className={`mb-3 transition-transform duration-200 ${
                    draggingId === banner.id ? "scale-95" : dragOverId === banner.id ? "scale-105" : ""
                  }`}>
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

                  <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
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
              </div>
            );
          })}
        </div>

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

