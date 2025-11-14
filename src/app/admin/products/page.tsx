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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "", description: "", imageUrl: "" });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

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

  const handleEdit = (product: Product) => {
    if (!product.id) return;
    setEditingId(product.id);
    setEditForm({
      title: product.title,
      price: product.price.toString(),
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (productId: string) => {
    try {
      let imageUrl = editForm.imageUrl;
      
      // Upload new image if provided
      if (editImageFile) {
        const formData = new FormData();
        formData.append("file", editImageFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          alert(uploadData?.error || "Failed to upload image");
          return;
        }
        
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          price: parseFloat(editForm.price),
          description: editForm.description || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(products.map(p => p.id === productId ? data.product : p));
        setEditingId(null);
        setEditImageFile(null);
        setEditImagePreview(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update product");
      }
    } catch (err) {
      alert("Failed to update product");
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
              {editingId === product.id ? (
                <div className="space-y-3">
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Title"
                  />
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    placeholder="Price"
                  />
                  <textarea
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                  />
                  <div>
                    <label className="block text-xs mb-1 text-gray-600">Product Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageChange}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                    <p className="text-xs text-zinc-400 mt-1">Upload new image to replace current one</p>
                    {(editImagePreview || editForm.imageUrl) && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">
                          {editImagePreview ? "New image preview:" : "Current image:"}
                        </p>
                        <img 
                          src={editImagePreview || editForm.imageUrl || ""} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded border" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => product.id && handleSave(product.id)}
                      className="flex-1 rounded bg-black px-3 py-1.5 text-white text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 rounded border px-3 py-1.5 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {product.brand && (
                    <p className="text-sm text-zinc-500 mb-1">{product.brand}</p>
                  )}
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="mt-1 text-lg font-medium">${product.price.toFixed(2)}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Stock: {product.stockQuantity ?? 0}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => product.id && handleDelete(product.id)}
                      className="flex-1 rounded border border-red-300 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
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

