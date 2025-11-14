import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductById } from "@/lib/productDb";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 60;

export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const totalPrice = product.price + (product.shippingCost || 0);

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/" className="inline-block mb-6 text-zinc-600 hover:text-black">
          ← Back to Store
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            {product.imageUrl ? (
              <div className="sticky top-8">
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  width={800}
                  height={800}
                  className="w-full rounded-lg border shadow-sm"
                  unoptimized={product.imageUrl.startsWith("http")}
                />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded-lg border flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-sm text-zinc-600 mb-2">{product.brand}</p>
              )}
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              {product.sku && (
                <p className="text-sm text-zinc-500 mb-4">SKU: {product.sku}</p>
              )}
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
                <p className={`text-sm mt-2 ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity} available)` : 'Out of Stock'}
                </p>
              )}
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4">
              {product.condition && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Condition</p>
                  <p className="font-medium">{product.condition}</p>
                </div>
              )}
              {product.category && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
              )}
              {product.color && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Color</p>
                  <p className="font-medium">{product.color}</p>
                </div>
              )}
              {product.material && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Material</p>
                  <p className="font-medium">{product.material}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-zinc-700 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Specifications</h2>
                <p className="text-zinc-700 whitespace-pre-line">{product.specifications}</p>
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
                  {product.weight && (
                    <p className="text-zinc-700">Weight: {product.weight} lbs</p>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {product.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-zinc-100 rounded-full text-sm text-zinc-700">
                      {tag.trim()}
                    </span>
                  ))}
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
                      Shipping Cost: {product.shippingCost === 0 ? 'Free' : `$${product.shippingCost.toFixed(2)}`}
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

            {/* Buy Button */}
            <div className="pt-4">
              <AddToCartButton 
                productId={product.id || ""}
                title={product.title}
                price={product.price}
                imageUrl={product.imageUrl}
                stockQuantity={product.stockQuantity}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

