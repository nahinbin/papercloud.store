import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/productDb";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductPageClient from "@/components/ProductPageClient";
import { siteConfig } from "@/lib/siteConfig";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShareButton from "@/components/ShareButton";
import SaveProductButton from "@/components/SaveProductButton";

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
  const quickFacts = [
    product.category && { label: "Category", value: product.category },
    product.material && { label: "Material", value: product.material },
    product.condition && { label: "Condition", value: product.condition },
    product.sku && { label: "SKU", value: product.sku },
  ].filter(Boolean) as { label: string; value: string }[];
  const highlightChips = [
    product.material,
    product.condition,
    product.weight ? `${product.weight} lbs` : undefined,
  ].filter(Boolean) as string[];
  const dimensionParts = [
    product.dimensionsWidth ? `${product.dimensionsWidth}" W` : undefined,
    product.dimensionsHeight ? `${product.dimensionsHeight}" H` : undefined,
    product.dimensionsDepth ? `${product.dimensionsDepth}" D` : undefined,
  ].filter(Boolean);
  const policyCards = [
    (product.estimatedShippingDays || product.shippingCost !== undefined) && {
      title: "Shipping",
      description: [
        product.estimatedShippingDays ? `Arrives in ~${product.estimatedShippingDays} business days` : undefined,
        product.shippingCost !== undefined
          ? product.shippingCost === 0
            ? "Free shipping"
            : `$${product.shippingCost.toFixed(2)} flat rate`
          : undefined,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    product.warranty && { title: "Warranty", description: product.warranty },
    product.returnPolicy && { title: "Returns", description: product.returnPolicy },
  ].filter(Boolean) as { title: string; description: string }[];
  const summarize = (text?: string) => {
    if (!text) return undefined;
    const normalized = text.replace(/\s+/g, " ").trim();
    return normalized.length > 90 ? `${normalized.slice(0, 87)}…` : normalized;
  };
  const heroHighlights = [
    product.estimatedShippingDays && {
      label: "Estimated Delivery",
      value: `~${product.estimatedShippingDays} business days`,
    },
    product.shippingCost !== undefined && {
      label: "Shipping",
      value: product.shippingCost === 0 ? "Free worldwide shipping" : `$${product.shippingCost.toFixed(2)} flat rate`,
    },
    product.returnPolicy && {
      label: "Return Policy",
      value: summarize(product.returnPolicy),
    },
    product.warranty && {
      label: "Warranty",
      value: summarize(product.warranty),
    },
  ]
    .filter(Boolean)
    .slice(0, 3) as { label: string; value: string }[];
  const shareUrl = `${siteConfig.url}/products/${product.id}`;
  const shareDescription = product.description?.slice(0, 120);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 pb-32 pt-8 sm:px-6 lg:px-8 lg:pb-24">
        <Breadcrumbs className="text-sm text-zinc-500" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <div className="space-y-8">
            <ProductImageGallery images={productImages} productTitle={product.title} />

            {product.description && (
              <section className="rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Description</h2>
                <p className="mt-3 text-base leading-relaxed text-zinc-700 whitespace-pre-line">{product.description}</p>
              </section>
            )}

            {(quickFacts.length > 0 || dimensionParts.length > 0 || product.weight) && (
              <section className="rounded-[28px] border border-zinc-100 bg-white p-6 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Details</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">{fact.label}</p>
                      <p className="mt-2 text-base font-semibold text-zinc-900">{fact.value}</p>
                    </div>
                  ))}

                  {(dimensionParts.length > 0 || product.weight) && (
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-600">
                      <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Dimensions & Weight</p>
                      <div className="mt-2 space-y-1 text-base font-medium text-zinc-900">
                        {dimensionParts.length > 0 && <p>{dimensionParts.join(" × ")}</p>}
                        {product.weight && <p>{product.weight} lbs</p>}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {policyCards.length > 0 && (
              <section className="grid gap-4 md:grid-cols-2">
                {policyCards.map((card) => (
                  <div key={card.title} className="rounded-[24px] border border-zinc-100 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">{card.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 whitespace-pre-line">{card.description}</p>
                  </div>
                ))}
              </section>
            )}
          </div>

          <aside className="space-y-6 self-start lg:sticky lg:top-10">
            <section className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
              <div className="space-y-3">
                {product.brand && (
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500">{product.brand}</p>
                )}
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 lg:text-4xl">{product.title}</h1>
                  <div className="flex items-center gap-2 text-zinc-500">
                    <SaveProductButton productId={product.id || ""} variant="minimal" size="sm" className="rounded-full" />
                    <ShareButton
                      url={shareUrl}
                      title={product.title}
                      description={shareDescription}
                      iconOnly
                      variant="minimal"
                      className="rounded-full"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-end gap-6 border-t border-zinc-100 pt-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Price</p>
                  <p className="mt-2 text-4xl font-bold text-zinc-900">${product.price.toFixed(2)}</p>
                </div>
                {product.shippingCost !== undefined && (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Shipping</p>
                    <p className="mt-2 text-base font-semibold text-zinc-800">
                      {product.shippingCost === 0 ? "Free shipping" : `+$${product.shippingCost.toFixed(2)}`}
                    </p>
                    {product.shippingCost > 0 && (
                      <p className="text-xs text-zinc-500">Total: ${totalPrice.toFixed(2)}</p>
                    )}
                  </div>
                )}
                {product.stockQuantity !== undefined && (
                  <span className="rounded-full border border-zinc-200 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-600">
                    {product.stockQuantity > 0 ? `In stock · ${product.stockQuantity} left` : "Out of stock"}
                  </span>
                )}
              </div>

              {highlightChips.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {highlightChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}

              {heroHighlights.length > 0 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {heroHighlights.map((highlight) => (
                    <div key={highlight.label} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-4 text-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">{highlight.label}</p>
                      <p className="mt-2 text-base font-medium text-zinc-900">{highlight.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8">
                <ProductPageClient
                  colorVariants={colorVariants}
                  sizeVariants={sizeVariants}
                  productId={product.id || ""}
                  title={product.title}
                  price={product.price}
                  imageUrl={productImages[0]}
                  stockQuantity={product.stockQuantity}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
