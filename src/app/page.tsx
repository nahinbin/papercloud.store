import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/productDb";
import { listBanners } from "@/lib/bannerDb";
import { getUserBySessionToken } from "@/lib/authDb";
import BannerCarousel from "@/components/BannerCarousel";
import { listCatalogues } from "@/lib/catalogueDb";

export const revalidate = 60; // Revalidate every 60 seconds

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  return user;
}

export default async function Home() {
  // Fetch data in parallel on the server
  // Wrap banner fetching in try-catch to handle cases where Banner model doesn't exist yet
  let banners: Awaited<ReturnType<typeof listBanners>> = [];
  try {
    banners = await listBanners(true); // Only get active banners
  } catch (error) {
    // Silently fail if banners can't be loaded (model not generated yet)
    console.warn("Could not load banners:", error);
  }

  const [catalogues, user, products] = await Promise.all([
    listCatalogues(true),
    getCurrentUser(),
    listProducts(),
  ]);

  const isAdmin = user?.isAdmin || user?.username === "admin" || false;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
      {/* Banner Section */}
      <div className="border-b border-zinc-100 bg-white/70">
        <BannerCarousel banners={banners} />
      </div>

      {catalogues.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Catalogues</p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
            {catalogues.map((catalogue) => {
              const href =
                catalogue.linkUrl ||
                `/catalogues/${encodeURIComponent(catalogue.slug || catalogue.id)}`;
              return (
                <Link
                  key={catalogue.id}
                  href={href}
                  className="group relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1"
                >
                  {catalogue.imageUrl ? (
                    <Image
                      src={catalogue.imageUrl}
                      alt={catalogue.title}
                      fill
                      className="object-cover"
                      unoptimized={catalogue.imageUrl?.startsWith("http") ?? false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-xl font-semibold text-zinc-300">
                      {catalogue.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />
                  <div className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-1 text-white">
                    <p className="text-[11px] font-semibold leading-tight line-clamp-1">{catalogue.title}</p>
                    {catalogue.description && (
                      <p className="text-[10px] text-white/80 line-clamp-1">{catalogue.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <section id="products" className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">Available now</h2>
            </div>
            <span className="text-sm text-zinc-500">{products.length} item{products.length === 1 ? "" : "s"}</span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-10 text-center shadow-sm">
              <p className="text-zinc-600">No products available yet.</p>
              {isAdmin && (
                <Link
                  href="/admin/products/new"
                  className="mt-4 inline-flex rounded-full border border-zinc-900/10 bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-black"
                >
                  Add the first product
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group rounded-3xl border border-zinc-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {product.imageUrl ? (
                    <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-zinc-100">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={400}
                        height={300}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        unoptimized={product.imageUrl.startsWith("http")}
                      />
                    </div>
                  ) : (
                    <div className="mb-4 flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50">
                      <span className="text-sm text-zinc-400">No image</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {product.brand && (
                      <p className="text-xs uppercase tracking-[0.23em] text-zinc-400">{product.brand}</p>
                    )}
                    <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900 group-hover:text-black">
                      {product.title}
                    </h3>
                    <p className="text-xl font-bold text-zinc-900">${product.price.toFixed(2)}</p>
                    {product.stockQuantity !== undefined && (
                      <p className={`text-xs ${product.stockQuantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
