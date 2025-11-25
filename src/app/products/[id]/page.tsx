import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/lib/productDb";
import AddToCartButton from "@/components/AddToCartButton";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductVariants from "@/components/ProductVariants";
import ProductPageClient from "@/components/ProductPageClient";
import { siteConfig } from "@/lib/siteConfig";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";

export const revalidate = 300; // Revalidate every 5 minutes (product data is cached in getProductById)

type ProductPageParams = Promise<{
  id: string;
}>;

export async function generateMetadata({ params }: { params: ProductPageParams }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = new URL(`/products/${id}`, siteConfig.url).toString();
  // Ensure image URL is absolute for better social media previews
  const imageUrl = product.imageUrl 
    ? (product.imageUrl.startsWith('http') ? product.imageUrl : new URL(product.imageUrl, siteConfig.url).toString())
    : new URL(siteConfig.ogImage, siteConfig.url).toString();
  
  const description = product.description?.slice(0, 160) ?? siteConfig.description;

  return {
    title: `${product.title} | ${siteConfig.name}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.title,
      description,
      url: canonical,
      type: "website", // Using "website" for better compatibility with WhatsApp/Instagram
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [imageUrl],
    },
    // Additional meta tags for better WhatsApp/Instagram previews
    other: {
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:type": "image/jpeg",
    },
  };
}

export default async function PublicProductDetailPage({ params }: { params: ProductPageParams }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // Parse multiple images from specifications (stored as JSON)
  let productImages: string[] = [];
  if (product.specifications) {
    try {
      const parsed = JSON.parse(product.specifications);
      if (Array.isArray(parsed) && parsed.length > 0) {
        productImages = parsed.map((img: any) => img.url || product.imageUrl || "").filter(Boolean);
      }
    } catch {
      // If not JSON, ignore
    }
  }
  
  // Fallback to single image if no multiple images found
  if (productImages.length === 0 && product.imageUrl) {
    productImages = [product.imageUrl];
  }

  // Parse color variants from color field (stored as JSON)
  let colorVariants: string[] | undefined = undefined;
  if (product.color) {
    try {
      const parsed = JSON.parse(product.color);
      if (Array.isArray(parsed)) {
        colorVariants = parsed;
      }
    } catch {
      // If not JSON, treat as single color (legacy)
      if (product.color) {
        colorVariants = [product.color];
      }
    }
  }

  // Parse size variants from tags field (stored as JSON)
  let sizeVariants: string[] | undefined = undefined;
  if (product.tags) {
    try {
      const parsed = JSON.parse(product.tags);
      if (Array.isArray(parsed)) {
        sizeVariants = parsed;
      }
    } catch {
      // If not JSON, ignore (tags might be regular text)
    }
  }

  const totalPrice = product.price + (product.shippingCost || 0);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <ProductImageGallery images={productImages} productTitle={product.title} />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.brand && <p className="text-sm text-zinc-600 mb-2">{product.brand}</p>}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-2">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
                  {product.sku && <p className="text-sm text-zinc-500 mb-4">SKU: {product.sku}</p>}
                </div>
                <ShareButton
                  url={`${siteConfig.url}/products/${product.id}`}
                  title={product.title}
                  description={product.description?.slice(0, 100)}
                  className="flex-shrink-0 w-full sm:w-auto"
                />
              </div>
            </div>

            {/* Price Section */}
            <div className="border-t border-b py-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
                {product.shippingCost !== undefined && product.shippingCost > 0 && (
                  <span className="text-sm text-zinc-600">+ ${product.shippingCost.toFixed(2)} shipping</span>
                )}
              </div>
              {product.shippingCost !== undefined && product.shippingCost > 0 && (
                <p className="text-lg font-semibold text-zinc-700">Total: ${totalPrice.toFixed(2)}</p>
              )}
              {product.stockQuantity !== undefined && (
                <p className={`text-sm mt-2 ${product.stockQuantity > 0 ? "text-green-600" : "text-red-600"}`}>
                  {product.stockQuantity > 0
                    ? `In Stock (${product.stockQuantity} available)`
                    : "Out of Stock"}
                </p>
              )}
            </div>

            {/* Variants Selection - Client Component */}
            <ProductPageClient
              colorVariants={colorVariants}
              sizeVariants={sizeVariants}
              productId={product.id || ""}
              title={product.title}
              price={product.price}
              imageUrl={productImages[0]}
              stockQuantity={product.stockQuantity}
            />

            {/* Quick Info */}
            {product.category && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Category</p>
                <p className="font-medium">{product.category}</p>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-zinc-700 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Dimensions & Weight */}
            {(product.dimensionsWidth || product.dimensionsHeight || product.dimensionsDepth || product.weight) && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Dimensions & Weight</h2>
                <div className="space-y-1 text-sm">
                  {product.dimensionsWidth && product.dimensionsHeight && product.dimensionsDepth && (
                    <p className="text-zinc-700">
                      Dimensions: {product.dimensionsWidth}" × {product.dimensionsHeight}" × {product.dimensionsDepth}"
                    </p>
                  )}
                  {product.weight && <p className="text-zinc-700">Weight: {product.weight} lbs</p>}
                </div>
              </div>
            )}

            {/* Shipping Info */}
            {(product.estimatedShippingDays || product.shippingCost !== undefined) && (
              <div className="bg-zinc-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Shipping Information</h2>
                <div className="space-y-1 text-sm">
                  {product.estimatedShippingDays && (
                    <p className="text-zinc-700">Estimated Delivery: {product.estimatedShippingDays} business days</p>
                  )}
                  {product.shippingCost !== undefined && (
                    <p className="text-zinc-700">
                      Shipping Cost: {product.shippingCost === 0 ? "Free" : `$${product.shippingCost.toFixed(2)}`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warranty */}
            {product.warranty && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Warranty</h2>
                <p className="text-zinc-700">{product.warranty}</p>
              </div>
            )}

            {/* Return Policy */}
            {product.returnPolicy && (
              <div className="bg-zinc-50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2">Return Policy</h2>
                <p className="text-zinc-700 whitespace-pre-line text-sm">{product.returnPolicy}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
