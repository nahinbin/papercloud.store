"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";

interface ImagePreview {
  file?: File;
  preview: string;
  id: string;
  isExisting?: boolean;
  originalUrl?: string; // Store original URL for existing images
}

interface Catalogue {
  id: string;
  title: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<ImagePreview[]>([]);
  const [description, setDescription] = useState("");
  const [selectedCatalogues, setSelectedCatalogues] = useState<string[]>([]);
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [brand, setBrand] = useState("");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [colorVariants, setColorVariants] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("");
  const [sizeVariants, setSizeVariants] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  const [condition, setCondition] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingCatalogues, setLoadingCatalogues] = useState(true);
  const [originalPrimaryImageUrl, setOriginalPrimaryImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch product data and catalogues in parallel
    Promise.all([
      fetch(`/api/products/${productId}`).then((res) => res.json()),
      fetch("/api/admin/catalogues").then((res) => res.json()),
    ])
      .then(([productData, cataloguesData]) => {
        const product = productData.product;
        if (!product) {
          setError("Product not found");
          setLoading(false);
          return;
        }

        // Set basic fields
        setTitle(product.title || "");
        setPrice(product.price?.toString() || "");
        setDescription(product.description || "");
        setBrand(product.brand || "");
        setSku(product.sku || "");
        setStockQuantity(product.stockQuantity?.toString() || "");

        // Parse color variants (stored as JSON in color field)
        if (product.color) {
          try {
            const parsed = JSON.parse(product.color);
            if (Array.isArray(parsed)) {
              setColorVariants(parsed);
            }
          } catch {
            // If not JSON, treat as single color (legacy)
            if (product.color) {
              setColorVariants([product.color]);
            }
          }
        }

        // Parse size variants (stored as JSON in tags field)
        if (product.tags) {
          try {
            const parsed = JSON.parse(product.tags);
            if (Array.isArray(parsed)) {
              setSizeVariants(parsed);
            }
          } catch {
            // If not JSON, ignore (tags might be regular text)
          }
        }

        // Parse multiple images (stored as JSON in specifications)
        if (product.specifications) {
          try {
            const parsed = JSON.parse(product.specifications);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const images: ImagePreview[] = parsed.map((img: any, index: number) => {
                const imageUrl = img.url || product.imageUrl || "";
                return {
                  id: `existing-${index}`,
                  preview: imageUrl,
                  isExisting: true,
                  originalUrl: imageUrl, // Store original URL
                };
              });
              setImageFiles(images);
              // Store original primary image URL
              if (images.length > 0) {
                setOriginalPrimaryImageUrl(images[0].originalUrl || images[0].preview);
              }
            } else if (product.imageUrl) {
              // Fallback to single image
              const fallbackImage = {
                id: "existing-0",
                preview: product.imageUrl,
                isExisting: true,
                originalUrl: product.imageUrl,
              };
              setImageFiles([fallbackImage]);
              setOriginalPrimaryImageUrl(product.imageUrl);
            }
          } catch {
            // If not JSON, use single image
            if (product.imageUrl) {
              const fallbackImage = {
                id: "existing-0",
                preview: product.imageUrl,
                isExisting: true,
                originalUrl: product.imageUrl,
              };
              setImageFiles([fallbackImage]);
              setOriginalPrimaryImageUrl(product.imageUrl);
            }
          }
        } else if (product.imageUrl) {
          // Single image fallback
          const fallbackImage = {
            id: "existing-0",
            preview: product.imageUrl,
            isExisting: true,
            originalUrl: product.imageUrl,
          };
          setImageFiles([fallbackImage]);
          setOriginalPrimaryImageUrl(product.imageUrl);
        }

        // Set catalogues
        setCatalogues((cataloguesData.catalogues || []).map((c: any) => ({ id: c.id, title: c.title })));
        setLoadingCatalogues(false);

        // Fetch product's catalogues
        fetch(`/api/admin/products/${productId}/catalogues`)
          .then((res) => res.json())
          .then((data) => {
            if (data.catalogueIds) {
              setSelectedCatalogues(data.catalogueIds);
            }
          })
          .catch(() => {
            // If endpoint doesn't exist, try to get from product data
          });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading product:", err);
        setError("Failed to load product");
        setLoading(false);
      });
  }, [productId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const id = Math.random().toString(36).substring(7);
          setImageFiles((prev) => [
            ...prev,
            { file, preview: reader.result as string, id, isExisting: false },
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

    setSaving(true);
    try {
      // Upload new images (only files that aren't existing)
      const newImageFiles = imageFiles.filter((img) => !img.isExisting && img.file);
      const uploadedImages: Array<{ url: string; mimeType: string }> = [];

      // Keep existing images - preserve their original URLs
      const existingImages = imageFiles
        .filter((img) => img.isExisting)
        .map((img) => ({
          url: img.originalUrl || img.preview,
          mimeType: "image/jpeg", // Default, will be preserved
        }));

      // Upload new images
      for (const imageFile of newImageFiles) {
        if (!imageFile.file) continue;

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

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImages];

      // Prepare variant data as JSON strings
      const colorVariantsJson = colorVariants.length > 0 ? JSON.stringify(colorVariants) : undefined;
      const sizeVariantsJson = sizeVariants.length > 0 ? JSON.stringify(sizeVariants) : undefined;
      const imagesJson = JSON.stringify(allImages);

      // Always update primary image if we have images
      // The primary image should always match the first image in the specifications array
      const imagePayload: any = {};
      
      if (allImages.length > 0) {
        const primaryImage = allImages[0];
        const currentPrimaryUrl = primaryImage.url;
        
        // Determine if primary image is a data URL or regular URL
        const isDataUrl = currentPrimaryUrl.startsWith("data:");
        const isApiEndpoint = currentPrimaryUrl.includes(`/api/products/${productId}/image`);
        
        // Check if primary image changed (different URL or reordered)
        const primaryImageChanged = originalPrimaryImageUrl !== currentPrimaryUrl;
        
        if (isDataUrl) {
          // If it's a data URL (newly uploaded or reordered), always send as imageData
          imagePayload.imageData = currentPrimaryUrl;
          imagePayload.imageMimeType = primaryImage.mimeType || "image/jpeg";
        } else if (isApiEndpoint && !primaryImageChanged) {
          // If it's from our API endpoint and hasn't changed, preserve existing imageData
          // Don't send image fields - the API will keep the existing imageData
        } else {
          // If it's a regular external URL or API endpoint that changed, send as imageUrl
          imagePayload.imageUrl = currentPrimaryUrl;
        }
      }

      // Build request body - always include all fields, use null for empty values
      const requestBody: any = {
        title,
        price: numericPrice,
        description: description || null,
        brand: brand || null,
        sku: sku || null,
        stockQuantity: stockQuantity ? Number(stockQuantity) : null,
        color: colorVariantsJson || null,
        tags: sizeVariantsJson || null,
        specifications: imagesJson || null, // Store all images as JSON in specifications
        catalogueIds: selectedCatalogues, // Pass catalogue IDs
      };

      // Add image fields if provided
      if (Object.keys(imagePayload).length > 0) {
        Object.assign(requestBody, imagePayload);
      }

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update product");
      }

      setSuccess("Product updated successfully!");
      setTimeout(() => router.push(`/admin/products/${productId}`), 1500);
    } catch (err: any) {
      setError(err?.message ?? "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <Breadcrumbs className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600">Update product details</p>
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
                  <p className="text-xs text-gray-500">Select one or more categories for this product</p>
                </div>
              ) : (
                <div className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-yellow-50">
                  <p className="text-sm text-yellow-800">
                    No categories found. Please create a category first in the{" "}
                    <Link href="/admin/catalogues" className="underline font-medium">
                      Categories section
                    </Link>
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
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
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
                  <span className="text-sm text-gray-600 font-medium">Click to upload images</span>
                  <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP - You can select multiple images</span>
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
                      {img.isExisting && (
                        <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Existing
                        </span>
                      )}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Color Variants</label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Size Variants</label>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Product SKU or code"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="Available units"
                />
              </div>

            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-black text-white rounded-lg px-6 py-3 font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? "Updating Product..." : "Update Product"}
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

