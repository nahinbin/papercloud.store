"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingCatalogues, setLoadingCatalogues] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const DRAFT_KEY = "product_draft";

  // Load draft on mount - from URL param or localStorage
  useEffect(() => {
    const loadDraft = async () => {
      // Check for draft ID in URL
      const draftIdParam = searchParams.get('draft');
      
      if (draftIdParam) {
        // Load draft from database
        try {
          const res = await fetch(`/api/admin/products/${draftIdParam}`);
          if (res.ok) {
            const data = await res.json();
            const product = data.product;
            if (product && product.isDraft) {
              setTitle(product.title || "");
              setPrice(product.price?.toString() || "");
              setDescription(product.description || "");
              setBrand(product.brand || "");
              setSku(product.sku || "");
              setStockQuantity(product.stockQuantity?.toString() || "");
              
              // Parse color and size variants
              if (product.color) {
                try {
                  const colors = JSON.parse(product.color);
                  if (Array.isArray(colors)) setColorVariants(colors);
                } catch {}
              }
              if (product.tags) {
                try {
                  const sizes = JSON.parse(product.tags);
                  if (Array.isArray(sizes)) setSizeVariants(sizes);
                } catch {}
              }
              
              // Parse images from specifications
              if (product.specifications) {
                try {
                  const images = JSON.parse(product.specifications);
                  if (Array.isArray(images)) {
                    const restoredImages = images.map((img: any) => ({
                      id: img.id || Math.random().toString(36).substring(7),
                      preview: img.url || img.preview,
                      file: null as any,
                    }));
                    setImageFiles(restoredImages);
                  }
                } catch {}
              }
              
              // Load catalogues for this product
              try {
                const catRes = await fetch(`/api/admin/products/${draftIdParam}/catalogues`);
                if (catRes.ok) {
                  const catData = await catRes.json();
                  if (catData.catalogueIds && Array.isArray(catData.catalogueIds)) {
                    setSelectedCatalogues(catData.catalogueIds);
                  }
                }
              } catch (error) {
                console.error("Failed to load draft catalogues:", error);
              }
              
              setDraftId(draftIdParam);
              setHasDraft(true);
              setDraftLoaded(true);
              return;
            }
          }
        } catch (error) {
          console.error("Failed to load draft from database:", error);
        }
      }
      
      // Fallback to localStorage
      if (typeof window !== "undefined") {
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft) {
              setTitle(draft.title || "");
              setPrice(draft.price || "");
              setDescription(draft.description || "");
              setSelectedCatalogues(draft.selectedCatalogues || []);
              setBrand(draft.brand || "");
              setSku(draft.sku || "");
              setStockQuantity(draft.stockQuantity || "");
              setColorVariants(draft.colorVariants || []);
              setSizeVariants(draft.sizeVariants || []);
              setCurrentStep(draft.currentStep || 1);
              
              // Restore image previews from base64
              if (draft.imagePreviews && Array.isArray(draft.imagePreviews)) {
                const restoredImages = draft.imagePreviews.map((img: any) => ({
                  id: img.id || Math.random().toString(36).substring(7),
                  preview: img.preview,
                  file: null as any,
                }));
                setImageFiles(restoredImages);
              }
              
              if (draft.draftId) {
                setDraftId(draft.draftId);
              }
              
              setHasDraft(true);
            }
          } catch (error) {
            console.error("Failed to load draft:", error);
          }
        }
      }
      
      setDraftLoaded(true);
    };
    
    loadDraft();
  }, [searchParams]);

  // Save draft whenever form data changes (debounced) - both localStorage and database
  useEffect(() => {
    if (draftLoaded) {
      const timeoutId = setTimeout(async () => {
        const draft = {
          title,
          price,
          description,
          selectedCatalogues,
          brand,
          sku,
          stockQuantity,
          colorVariants,
          sizeVariants,
          currentStep,
          imagePreviews: imageFiles.map(img => ({
            id: img.id,
            preview: img.preview,
          })),
          savedAt: new Date().toISOString(),
        };
        
        // Only save if there's some data
        const hasData = title || price || description || selectedCatalogues.length > 0 || 
                       brand || sku || stockQuantity || colorVariants.length > 0 || 
                       sizeVariants.length > 0 || imageFiles.length > 0;
        
        if (hasData) {
          // Save to localStorage (include draftId if available)
          const draftToSave = { ...draft, draftId };
          localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
          setHasDraft(true);

          // Save to database
          try {
            // Prepare image data (use first image if available)
            const primaryImage = imageFiles.find(img => img.file !== null);
            let imageData = null;
            let imageMimeType = null;
            
            if (primaryImage?.preview && primaryImage.preview.startsWith('data:')) {
              imageData = primaryImage.preview;
              const matches = primaryImage.preview.match(/^data:([^;]+);base64,/);
              if (matches) {
                imageMimeType = matches[1];
              }
            }

            // Prepare variant data
            const colorVariantsJson = colorVariants.length > 0 ? JSON.stringify(colorVariants) : undefined;
            const sizeVariantsJson = sizeVariants.length > 0 ? JSON.stringify(sizeVariants) : undefined;
            const imagesJson = imageFiles.length > 0 ? JSON.stringify(imageFiles.map(img => ({ id: img.id, preview: img.preview }))) : undefined;

            const res = await fetch("/api/products/draft", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                draftId,
                title: title || "",
                price: price ? Number(price) : 0,
                description: description || undefined,
                imageData: imageData,
                imageMimeType: imageMimeType,
                brand: brand || undefined,
                sku: sku || undefined,
                stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
                color: colorVariantsJson,
                tags: sizeVariantsJson,
                specifications: imagesJson,
                catalogueIds: selectedCatalogues,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.id) {
                setDraftId(data.id);
              }
            }
          } catch (error) {
            console.error("Failed to save draft to database:", error);
            // Don't show error to user, just log it
          }
        } else {
          localStorage.removeItem(DRAFT_KEY);
          setHasDraft(false);
        }
      }, 2000); // Debounce by 2 seconds for database saves

      return () => clearTimeout(timeoutId);
    }
  }, [title, price, description, selectedCatalogues, brand, sku, stockQuantity, 
      colorVariants, sizeVariants, currentStep, imageFiles, draftLoaded, draftId]);

  useEffect(() => {
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
          setImageFiles((prev) => {
            // Filter out any images without file objects (from draft)
            const validImages = prev.filter(img => img.file !== null);
            return [
              ...validImages,
              { file, preview: reader.result as string, id },
            ];
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const clearDraft = async () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setDraftLoaded(false);
    
    // Delete draft from database if it exists
    if (draftId) {
      try {
        await fetch(`/api/admin/products/${draftId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete draft:", error);
      }
      setDraftId(null);
    }
    
    // Reset form
    setTitle("");
    setPrice("");
    setDescription("");
    setSelectedCatalogues([]);
    setBrand("");
    setSku("");
    setStockQuantity("");
    setColorVariants([]);
    setSizeVariants([]);
    setImageFiles([]);
    setCurrentStep(1);
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

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      setIsTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
      setIsTransitioning(false);
    }, 300);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const numericPrice = price ? Number(price) : 0;
    if (price && (Number.isNaN(numericPrice) || numericPrice < 0)) {
      setError("Price must be a valid number");
      return;
    }
    
    setLoading(true);
    try {
      const uploadedImages: Array<{ url: string; mimeType: string }> = [];
      
      // Only upload images that have file objects (skip draft-restored images without files)
      const imagesToUpload = imageFiles.filter(img => img.file !== null);
      
      for (const imageFile of imagesToUpload) {
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

      const colorVariantsJson = colorVariants.length > 0 ? JSON.stringify(colorVariants) : undefined;
      const sizeVariantsJson = sizeVariants.length > 0 ? JSON.stringify(sizeVariants) : undefined;
      const imagesJson = uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : undefined;
      const primaryImage = uploadedImages[0];

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          price: numericPrice || undefined,
          imageData: primaryImage?.url,
          imageMimeType: primaryImage?.mimeType,
          description: description || undefined,
          brand: brand || undefined,
          sku: sku || undefined,
          stockQuantity: stockQuantity ? Number(stockQuantity) : undefined,
          color: colorVariantsJson,
          tags: sizeVariantsJson,
          specifications: imagesJson,
          catalogueIds: selectedCatalogues,
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
      
      // Clear draft on successful save
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      
      // If this was a draft, update it to not be a draft anymore
      if (draftId) {
        try {
          await fetch(`/api/admin/products/${draftId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDraft: false }),
          });
        } catch (error) {
          console.error("Failed to update draft status:", error);
        }
      }
      
      setSuccess("Product saved successfully!");
      setTimeout(() => router.push(`/admin/products/${data.id}`), 1500);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Product Name" },
    { number: 2, title: "Images & Details" },
    { number: 3, title: "Additional Info" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 py-4 md:py-8">
      <div className="mx-auto max-w-3xl px-3 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 mb-1 md:mb-2">Create New Product</h1>
          <p className="text-sm md:text-base text-zinc-600">Let's build something amazing together</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 md:mb-8">
          <div className="relative flex items-center justify-center mb-2 md:mb-4">
            {/* Connector lines - positioned absolutely */}
            <div className="absolute top-4 md:top-6 left-0 right-0 h-0.5 md:h-1 bg-zinc-200 -z-10">
              <div
                className="h-full bg-black transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="relative flex items-center justify-between w-full max-w-2xl px-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-col items-center relative z-10 flex-1">
                  <div
                    className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm transition-all duration-500 ${
                      currentStep >= step.number
                        ? "bg-black text-white scale-110 shadow-lg"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`mt-1 md:mt-2 text-[10px] md:text-xs font-medium text-center transition-colors duration-300 ${
                      currentStep >= step.number ? "text-black" : "text-zinc-400"
                    }`}
                    style={{ 
                      maxWidth: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Draft Banner */}
        {draftLoaded && hasDraft && (
          <div className="mb-4 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-800">
                Draft restored from previous session
              </span>
            </div>
            <button
              type="button"
              onClick={clearDraft}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Clear draft
            </button>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={onSubmit} className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-zinc-100 overflow-hidden">
          <div className="p-4 md:p-8 lg:p-12">
            {/* Step 1: Product Name */}
            {currentStep === 1 && (
              <div
                className={`transition-all duration-500 ${
                  isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                }`}
              >
                <div className="max-w-md mx-auto">
                  <div className="mb-4 md:mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/5 mb-2 md:mb-4">
                      <svg className="w-6 h-6 md:w-8 md:h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1 md:mb-2">What's the product name?</h2>
                    <p className="text-sm md:text-base text-zinc-600">Give your product a memorable name</p>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-lg md:text-2xl font-semibold border-0 border-b-2 border-zinc-200 focus:border-black focus:outline-none focus:ring-0 px-0 py-3 md:py-4 transition-colors duration-300 bg-transparent"
                      placeholder="Enter product name..."
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Images, Categories, Price */}
            {currentStep === 2 && (
              <div
                className={`transition-all duration-500 ${
                  isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                }`}
              >
                <div className="mb-4 md:mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/5 mb-2 md:mb-4">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1 md:mb-2">Add images & details</h2>
                  <p className="text-sm md:text-base text-zinc-600">Show off your product with photos and set the basics</p>
                </div>

                <div className="space-y-4 md:space-y-8">
                  {/* Product Images */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Product Images</label>
                    <div className="border-2 border-dashed border-zinc-300 rounded-lg md:rounded-xl p-4 md:p-8 text-center hover:border-black transition-colors duration-300 group cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-zinc-100 group-hover:bg-black transition-colors duration-300 flex items-center justify-center mb-2 md:mb-4">
                          <svg className="w-6 h-6 md:w-8 md:h-8 text-zinc-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-zinc-700 group-hover:text-black transition-colors duration-300">
                          {imageFiles.length > 0 ? `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} selected` : "Click to upload images"}
                        </span>
                        <span className="text-[10px] md:text-xs text-zinc-500 mt-1">PNG, JPG, GIF, WEBP</span>
                      </label>
                    </div>

                    {imageFiles.length > 0 && (
                      <div className="mt-3 md:mt-4">
                        {imageFiles.some(img => img.file === null) && (
                          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                              ⚠️ Some images were restored from draft. Please re-upload them to ensure they're saved.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                          {imageFiles.map((img) => (
                            <div key={img.id} className="relative group">
                              <div className="aspect-square rounded-xl overflow-hidden border-2 border-zinc-200">
                                <img
                                  src={img.preview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {img.file === null && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                  <span className="text-xs text-white font-medium">Re-upload needed</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:bg-red-600"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Categories</label>
                    {loadingCatalogues ? (
                      <div className="w-full border border-zinc-300 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 bg-zinc-50">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs md:text-sm text-zinc-600">Loading categories...</span>
                        </div>
                      </div>
                    ) : catalogues.length > 0 ? (
                      <div className="space-y-2 md:space-y-3">
                        <div className="border border-zinc-200 rounded-lg md:rounded-xl p-2 md:p-4 max-h-48 md:max-h-64 overflow-y-auto">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {catalogues.map((catalogue) => (
                              <label
                                key={catalogue.id}
                                className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                  selectedCatalogues.includes(catalogue.id)
                                    ? "bg-black text-white shadow-md"
                                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
                                }`}
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
                                  className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-black"
                                />
                                <span className="text-xs md:text-sm font-medium">{catalogue.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full border border-yellow-300 rounded-xl px-4 py-3 bg-yellow-50">
                        <p className="text-sm text-yellow-800">
                          No categories found.{" "}
                          <a href="/admin/catalogues" className="underline font-medium hover:text-yellow-900">
                            Create one first
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium text-sm md:text-base">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        inputMode="decimal"
                        className="w-full border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 pl-7 md:pl-8 py-3 md:py-4 text-base md:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Info */}
            {currentStep === 3 && (
              <div
                className={`transition-all duration-500 ${
                  isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                }`}
              >
                <div className="mb-4 md:mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/5 mb-2 md:mb-4">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1 md:mb-2">Additional information</h2>
                  <p className="text-sm md:text-base text-zinc-600">Add more details to help customers find your product</p>
                </div>

                <div className="space-y-4 md:space-y-6">
                  {/* Description */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Description</label>
                    <textarea
                      className="w-full border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 resize-none text-sm md:text-base"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your product..."
                    />
                  </div>

                  {/* Color Variants */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Color Variants</label>
                    <div className="flex gap-2 mb-2 md:mb-3">
                      <input
                        className="flex-1 border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 text-sm md:text-base"
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
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-black text-white rounded-lg md:rounded-xl hover:bg-zinc-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm md:text-base"
                      >
                        Add
                      </button>
                    </div>
                    {colorVariants.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {colorVariants.map((color) => (
                          <span
                            key={color}
                            className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-zinc-100 text-zinc-700 rounded-full text-xs md:text-sm font-medium"
                          >
                            {color}
                            <button
                              type="button"
                              onClick={() => removeColorVariant(color)}
                              className="text-red-500 hover:text-red-700 transition-colors text-base md:text-lg"
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
                    <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Size Variants</label>
                    <div className="flex gap-2 mb-2 md:mb-3">
                      <input
                        className="flex-1 border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 text-sm md:text-base"
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
                        className="px-4 md:px-6 py-2 md:py-2.5 bg-black text-white rounded-lg md:rounded-xl hover:bg-zinc-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm md:text-base"
                      >
                        Add
                      </button>
                    </div>
                    {sizeVariants.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sizeVariants.map((size) => (
                          <span
                            key={size}
                            className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-zinc-100 text-zinc-700 rounded-full text-xs md:text-sm font-medium"
                          >
                            {size}
                            <button
                              type="button"
                              onClick={() => removeSizeVariant(size)}
                              className="text-red-500 hover:text-red-700 transition-colors text-base md:text-lg"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Brand</label>
                      <input
                        className="w-full border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 text-sm md:text-base"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Brand name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">SKU</label>
                      <input
                        className="w-full border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 text-sm md:text-base"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Product SKU or code"
                      />
                    </div>

                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-zinc-700 mb-2 md:mb-3">Stock Quantity</label>
                      <input
                        className="w-full border-2 border-zinc-200 rounded-lg md:rounded-xl px-3 md:px-4 py-2 md:py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 text-sm md:text-base"
                        type="number"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        placeholder="Available units"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="mt-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-6 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                {success}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="border-t border-zinc-200 bg-zinc-50 px-4 md:px-8 lg:px-12 py-4 md:py-6 flex items-center justify-between gap-2 md:gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 md:px-6 py-2.5 md:py-3 border-2 border-zinc-300 text-zinc-700 rounded-lg md:rounded-xl hover:bg-white hover:border-zinc-400 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-50 text-sm md:text-base"
            >
              <span className="flex items-center gap-1 md:gap-2">
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </span>
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-black text-white rounded-lg md:rounded-xl hover:bg-zinc-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                Continue
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 md:px-8 py-2.5 md:py-3 bg-black text-white rounded-lg md:rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center gap-1 md:gap-2 text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Save Product</span>
                    <span className="sm:hidden">Save</span>
                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
