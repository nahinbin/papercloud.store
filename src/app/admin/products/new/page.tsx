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
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [dimensionsWidth, setDimensionsWidth] = useState<string>("");
  const [dimensionsHeight, setDimensionsHeight] = useState<string>("");
  const [dimensionsDepth, setDimensionsDepth] = useState<string>("");
  const [color, setColor] = useState("");
  const [material, setMaterial] = useState("");
  const [condition, setCondition] = useState("");
  const [tags, setTags] = useState("");
  const [shippingCost, setShippingCost] = useState<string>("");
  const [estimatedShippingDays, setEstimatedShippingDays] = useState<string>("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [warranty, setWarranty] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
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

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: numericPrice,
          imageUrl,
          description: description || undefined,
          category: category || undefined,
          brand: brand || undefined,
          sku: sku || undefined,
          stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
          weight: weight ? Number(weight) : undefined,
          dimensionsWidth: dimensionsWidth ? Number(dimensionsWidth) : undefined,
          dimensionsHeight: dimensionsHeight ? Number(dimensionsHeight) : undefined,
          dimensionsDepth: dimensionsDepth ? Number(dimensionsDepth) : undefined,
          color: color || undefined,
          material: material || undefined,
          condition: condition || undefined,
          tags: tags || undefined,
          shippingCost: shippingCost ? Number(shippingCost) : undefined,
          estimatedShippingDays: estimatedShippingDays ? Number(estimatedShippingDays) : undefined,
          returnPolicy: returnPolicy || undefined,
          warranty: warranty || undefined,
          specifications: specifications || undefined,
        }),
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
      setTimeout(() => router.push(`/admin/products/${data.id}`), 800);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">New Product</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input className="w-full border rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Electronics, Clothing" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input className="w-full border rounded px-3 py-2" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SKU</label>
            <input className="w-full border rounded px-3 py-2" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Product SKU or code" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stock Quantity</label>
            <input className="w-full border rounded px-3 py-2" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} placeholder="Available units" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Product Image</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="w-full border rounded px-3 py-2" 
            />
            <p className="text-xs text-zinc-500 mt-1">PNG, JPG, GIF, WEBP - max 5MB</p>
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Preview" className="w-full max-w-md h-48 object-cover rounded border" />
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded px-3 py-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input className="w-full border rounded px-3 py-2" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g., Red, Blue, Black" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Material</label>
            <input className="w-full border rounded px-3 py-2" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g., Cotton, Plastic, Metal" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select className="w-full border rounded px-3 py-2" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Select condition</option>
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Used">Used</option>
              <option value="Refurbished">Refurbished</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Weight (lbs)</label>
            <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Product weight" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Width (inches)</label>
            <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={dimensionsWidth} onChange={(e) => setDimensionsWidth(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Height (inches)</label>
            <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={dimensionsHeight} onChange={(e) => setDimensionsHeight(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Depth (inches)</label>
            <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={dimensionsDepth} onChange={(e) => setDimensionsDepth(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input className="w-full border rounded px-3 py-2" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated tags" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Shipping Cost</label>
            <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Estimated Shipping Days</label>
            <input className="w-full border rounded px-3 py-2" type="number" value={estimatedShippingDays} onChange={(e) => setEstimatedShippingDays(e.target.value)} placeholder="Days" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Return Policy</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="Return policy details" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Warranty</label>
            <input className="w-full border rounded px-3 py-2" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g., 1 year manufacturer warranty" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Specifications</label>
            <textarea className="w-full border rounded px-3 py-2" rows={4} value={specifications} onChange={(e) => setSpecifications(e.target.value)} placeholder="Additional technical specifications or details" />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button disabled={loading} className="bg-black text-white rounded px-6 py-2 hover:bg-gray-800 disabled:opacity-50">{loading ? "Saving..." : "Save Product"}</button>
          <a href="/" className="border rounded px-6 py-2 hover:bg-gray-50">Cancel</a>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </form>
    </div>
  );
}
