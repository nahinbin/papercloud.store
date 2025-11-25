"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [description, setDescription] = useState("");
  const [selectedCatalogues, setSelectedCatalogues] = useState<string[]>([]);
  const [catalogues, setCatalogues] = useState<Array<{ id: string; title: string }>>([]);
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [colorVariants, setColorVariants] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("");
  const [sizeVariants, setSizeVariants] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  const [condition, setCondition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingCatalogues, setLoadingCatalogues] = useState(true);

  useEffect(() => {
    // Fetch existing catalogues
    fetch("/api/admin/catalogues")
      .then((res) => res.json())
      .then((data) => {
        setCatalogues((data.catalogues || []).map((c: any) => ({ id: c.id, title: c.title })));
        setLoadingCatalogues(false);
      })
      .catch(() => {
        setLoadingCatalogues(false);
      });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const id = Math.random().toString(36).substring(7);
          setImageFiles((prev) => [
            ...prev,
            { file, preview: reader.result as string, id },
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (id: string) => {
    setImageFiles((prev) => prev.filter((img) => img.id !== id));
  };

  const addColorVariant = () => {
    if (newColor.trim() && !colorVariants.includes(newColor.trim())) {
      setColorVariants([...colorVariants, newColor.trim()]);
      setNewColor("");
    }
  };

  const removeColorVariant = (color: string) => {
    setColorVariants(colorVariants.filter((c) => c !== color));
  };

  const addSizeVariant = () => {
    if (newSize.trim() && !sizeVariants.includes(newSize.trim())) {
      setSizeVariants([...sizeVariants, newSize.trim()]);
      setNewSize("");
    }
  };

  const removeSizeVariant = (size: string) => {
    setSizeVariants(sizeVariants.filter((s) => s !== size));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!title || !price) {
      setError("Title and price are required");
      return;
    }
    
    if (selectedCatalogues.length === 0) {
      setError("Please select at least one category");
      return;
    }
    
    if (imageFiles.length === 0) {
      setError("Please upload at least one product image");
      return;
    }
    
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setError("Price must be a valid number");
      return;
    }
    
    setLoading(true);
    try {
      // Upload all images
      const uploadedImages: Array<{ url: string; mimeType: string }> = [];
      
      for (const imageFile of imageFiles) {
        const formData = new FormData();
        formData.append("file", imageFile.file);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadData?.error || "Failed to upload image");
        }
        
        const uploadData = await uploadRes.json();
        uploadedImages.push({
          url: uploadData.url,
          mimeType: uploadData.mimeType,
        });
      }

      // Prepare variant data as JSON strings
      const colorVariantsJson = colorVariants.length > 0 ? JSON.stringify(colorVariants) : undefined;
      const sizeVariantsJson = sizeVariants.length > 0 ? JSON.stringify(sizeVariants) : undefined;
      const imagesJson = JSON.stringify(uploadedImages);

      // Use first image as primary image
      const primaryImage = uploadedImages[0];

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: numericPrice,
          imageData: primaryImage.url,
          imageMimeType: primaryImage.mimeType,
          description: description || undefined,
          brand: brand || undefined,
          sku: sku || undefined,
          stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
          color: colorVariantsJson,
          tags: sizeVariantsJson,
          condition: condition || undefined,
          specifications: imagesJson, // Store all images as JSON in specifications
          catalogueIds: selectedCatalogues, // Pass catalogue IDs
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
      setSuccess("Product saved successfully!");
      setTimeout(() => router.push(`/admin/products/${data.id}`), 1500);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Product</h1>
          <p className="text-gray-600">Fill in the details to add a new product to your store</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="space-y-6">
            {/* Title and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categories <span className="text-red-500">*</span>
              </label>
              {loadingCatalogues ? (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50">
                  Loading categories...
                </div>
              ) : catalogues.length > 0 ? (
                <div className="space-y-2">
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {catalogues.map((catalogue) => (
                      <label
                        key={catalogue.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCatalogues.includes(catalogue.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCatalogues([...selectedCatalogues, catalogue.id]);
                            } else {
                              setSelectedCatalogues(selectedCatalogues.filter((id) => id !== catalogue.id));
                            }
                          }}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <span className="text-sm text-gray-700">{catalogue.title}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCatalogues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCatalogues.map((catalogueId) => {
                        const catalogue = catalogues.find((c) => c.id === catalogueId);
                        return catalogue ? (
                          <span
                            key={catalogueId}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {catalogue.title}
                            <button
                              type="button"
                              onClick={() => setSelectedCatalogues(selectedCatalogues.filter((id) => id !== catalogueId))}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Select one or more categories for this product
                  </p>
                </div>
              ) : (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-yellow-50">
                  <p className="text-sm text-yellow-800">
                    No categories found. Please create a category first in the{" "}
                    <a href="/admin/catalogues" className="underline font-medium">
                      Categories section
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* Product Images - Multiple Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    className="w-12 h-12 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">
                    Click to upload images
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, WEBP - You can select multiple images
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {imageFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageFiles.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
              />
            </div>

            {/* Color Variants */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Color Variants
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addColorVariant();
                    }
                  }}
                  placeholder="Enter color (e.g., Red, Blue, Black)"
                />
                <button
                  type="button"
                  onClick={addColorVariant}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Add
                </button>
              </div>
              {colorVariants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colorVariants.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColorVariant(color)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Size Variants */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Size Variants
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSizeVariant();
                    }
                  }}
                  placeholder="Enter size (e.g., S, M, L, XL)"
                />
                <button
                  type="button"
                  onClick={addSizeVariant}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Add
                </button>
              </div>
              {sizeVariants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sizeVariants.map((size) => (
                    <span
                      key={size}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => removeSizeVariant(size)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Product SKU or code"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Available units"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="">Select condition</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-black text-white rounded-lg px-6 py-3 font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "Saving Product..." : "Save Product"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
