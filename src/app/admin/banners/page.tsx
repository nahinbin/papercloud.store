"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
    imageUrl: "",
    mobileImageUrl: "",
    desktopImageUrl: "",
    linkUrl: "", 
    order: "0",
    isActive: true 
  });
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);
  const [desktopImageFile, setDesktopImageFile] = useState<File | null>(null);
  const [desktopImagePreview, setDesktopImagePreview] = useState<string | null>(null);

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
          fetchBanners();
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

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners || []);
      } else {
        setError("Failed to load banners");
      }
    } catch (err) {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMobileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesktopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesktopImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let mobileImageData: string | undefined = undefined;
      let mobileImageMimeType: string | undefined = undefined;
      let desktopImageData: string | undefined = undefined;
      let desktopImageMimeType: string | undefined = undefined;
      
      // Convert mobile image file to base64 if provided
      if (mobileImageFile) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(mobileImageFile);
        });
        mobileImageData = dataUrl;
        mobileImageMimeType = mobileImageFile.type;
      }

      // Convert desktop image file to base64 if provided
      if (desktopImageFile) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(desktopImageFile);
        });
        desktopImageData = dataUrl;
        desktopImageMimeType = desktopImageFile.type;
      }

      const payload: any = {
        title: form.title || undefined,
        mobileImageUrl: form.mobileImageUrl || undefined,
        desktopImageUrl: form.desktopImageUrl || undefined,
        linkUrl: form.linkUrl || undefined,
        order: parseInt(form.order) || 0,
        isActive: form.isActive,
      };

      if (mobileImageData) {
        payload.mobileImageData = mobileImageData;
        payload.mobileImageMimeType = mobileImageMimeType;
      }

      if (desktopImageData) {
        payload.desktopImageData = desktopImageData;
        payload.desktopImageMimeType = desktopImageMimeType;
      }

      const url = editingId 
        ? `/api/admin/banners/${editingId}`
        : "/api/admin/banners";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      imageUrl: "",
      mobileImageUrl: banner.mobileImageUrl || "",
      desktopImageUrl: banner.desktopImageUrl || "",
      linkUrl: banner.linkUrl || "",
      order: banner.order.toString(),
      isActive: banner.isActive,
    });
    setMobileImageFile(null);
    setMobileImagePreview(banner.mobileImageUrl || null);
    setDesktopImageFile(null);
    setDesktopImagePreview(banner.desktopImageUrl || null);
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
    setForm({ title: "", imageUrl: "", mobileImageUrl: "", desktopImageUrl: "", linkUrl: "", order: "0", isActive: true });
    setMobileImageFile(null);
    setMobileImagePreview(null);
    setDesktopImageFile(null);
    setDesktopImagePreview(null);
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
          <Link href="/admin" className="text-zinc-600 hover:text-black underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title (optional)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Banner title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Banner */}
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileImageChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="font-medium text-blue-900 mb-1">📱 Mobile Banner:</p>
                    <ul className="text-blue-800 space-y-1 text-xs">
                      <li>• <strong>Optimal Size:</strong> 750 × 392px</li>
                      <li>• <strong>Aspect Ratio:</strong> 750:392 (1.91:1)</li>
                      <li>• <strong>Display:</strong> Full width on mobile devices</li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Mobile Image URL (optional)</label>
                    <input
                      type="url"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={form.mobileImageUrl}
                      onChange={(e) => setForm({ ...form, mobileImageUrl: e.target.value })}
                      placeholder="https://example.com/mobile-banner.jpg"
                    />
                  </div>
                  {(mobileImagePreview || form.mobileImageUrl) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">
                        {mobileImagePreview ? "Mobile preview:" : "Current mobile image:"}
                      </p>
                      <div className="relative w-full h-32 rounded border overflow-hidden bg-gray-100">
                        <Image
                          src={mobileImagePreview || form.mobileImageUrl || ""}
                          alt="Mobile Preview"
                          fill
                          className="object-contain"
                          unoptimized={form.mobileImageUrl?.startsWith("http")}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop Banner */}
                <div>
                  <label className="block text-sm font-medium mb-1">Desktop Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDesktopImageChange}
                    className="w-full border rounded px-3 py-2"
                  />
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
                    <p className="font-medium text-green-900 mb-1">🖥️ Desktop Banner:</p>
                    <ul className="text-green-800 space-y-1 text-xs">
                      <li>• <strong>Optimal Size:</strong> 1904 × 382px</li>
                      <li>• <strong>Aspect Ratio:</strong> 1904:382 (4.98:1)</li>
                      <li>• <strong>Display:</strong> Full width on desktop devices</li>
                    </ul>
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs font-medium mb-1 text-gray-600">Desktop Image URL (optional)</label>
                    <input
                      type="url"
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={form.desktopImageUrl}
                      onChange={(e) => setForm({ ...form, desktopImageUrl: e.target.value })}
                      placeholder="https://example.com/desktop-banner.jpg"
                    />
                  </div>
                  {(desktopImagePreview || form.desktopImageUrl) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">
                        {desktopImagePreview ? "Desktop preview:" : "Current desktop image:"}
                      </p>
                      <div className="relative w-full h-32 rounded border overflow-hidden bg-gray-100">
                        <Image
                          src={desktopImagePreview || form.desktopImageUrl || ""}
                          alt="Desktop Preview"
                          fill
                          className="object-contain"
                          unoptimized={form.desktopImageUrl?.startsWith("http")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link URL (optional)</label>
                <input
                  type="url"
                  className="w-full border rounded px-3 py-2"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  URL to navigate to when banner is clicked
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Order</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Lower numbers appear first
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.isActive ? "active" : "inactive"}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
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
          {banners.map((banner) => (
            <div key={banner.id} className="border rounded-lg p-4 bg-white">
              <div className="mb-3">
                {banner.imageUrl ? (
                  <div className="relative w-full h-32 rounded overflow-hidden bg-gray-100">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || "Banner"}
                      fill
                      className="object-cover"
                      unoptimized={banner.imageUrl.startsWith("http")}
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              
              {banner.title && (
                <h3 className="font-semibold mb-1">{banner.title}</h3>
              )}
              
              <div className="text-sm text-zinc-600 space-y-1">
                <p>Order: {banner.order}</p>
                <p>Status: <span className={banner.isActive ? "text-green-600" : "text-red-600"}>
                  {banner.isActive ? "Active" : "Inactive"}
                </span></p>
                {banner.linkUrl && (
                  <p className="text-xs truncate">Link: {banner.linkUrl}</p>
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
          ))}
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

