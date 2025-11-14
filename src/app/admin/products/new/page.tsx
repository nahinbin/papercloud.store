"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";

export default function NewProductPage() {
const router = useRouter();
const [title, setTitle] = useState("");
const [price, setPrice] = useState<string>("");
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [description, setDescription] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setImageFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const onSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError(null);
setSuccess(null);
if (!title || !price) {
setError("Title and price are required");
return;
}
const numericPrice = Number(price);
if (Number.isNaN(numericPrice) || numericPrice < 0) {
setError("Price must be a valid number");
return;
}
setLoading(true);
try {
  let imageUrl = "";
  
  // Upload image if provided
  if (imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);
    
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!uploadRes.ok) {
      const uploadData = await uploadRes.json().catch(() => ({}));
      throw new Error(uploadData?.error || "Failed to upload image");
    }
    
    const uploadData = await uploadRes.json();
    imageUrl = uploadData.url;
  }

  // Create product
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, price: numericPrice, imageUrl, description }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error("You must be logged in to create products. Please login or register first.");
    }
    if (res.status === 403) {
      throw new Error("Only admins can create products.");
    }
    throw new Error(data?.error || "Failed to save");
  }
  const data = await res.json();
  setSuccess("Saved!");
  setTitle("");
  setPrice("");
  setImageFile(null);
  setImagePreview(null);
  setDescription("");
  setTimeout(() => router.push(`/admin/products/${data.id}`), 800);
} catch (err: any) {
setError(err?.message ?? "Failed to save");
} finally {
setLoading(false);
}
};

return (
<div className="mx-auto max-w-2xl px-4 py-8">
<h1 className="text-2xl font-semibold mb-6">New Product</h1>
<form onSubmit={onSubmit} className="space-y-4">
<div>
<label className="block text-sm mb-1">Title</label>
<input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
</div>
<div>
<label className="block text-sm mb-1">Price</label>
<input className="w-full border rounded px-3 py-2" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
</div>
<div>
<label className="block text-sm mb-1">Product Image (optional)</label>
<input 
  type="file" 
  accept="image/*" 
  onChange={handleImageChange}
  className="w-full border rounded px-3 py-2" 
/>
<p className="text-xs text-zinc-500 mt-1">Upload an image file (PNG, JPG, GIF, WEBP - max 5MB)</p>
{imagePreview && (
  <div className="mt-2">
    <p className="text-xs text-zinc-600 mb-1">Preview:</p>
    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded border" />
  </div>
)}
</div>
<div>
<label className="block text-sm mb-1">Description (optional)</label>
<textarea className="w-full border rounded px-3 py-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
</div>
<div className="flex gap-2">
<button disabled={loading} className="bg-black text-white rounded px-4 py-2">{loading ? "Saving..." : "Save"}</button>
<a href="/" className="border rounded px-4 py-2">Cancel</a>
</div>
{error && <p className="text-sm text-red-600">{error}</p>}
{success && <p className="text-sm text-green-600">{success}</p>}
</form>
</div>
);
}