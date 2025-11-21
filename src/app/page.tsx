import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/productDb";
import { listBanners } from "@/lib/bannerDb";
import { getUserBySessionToken } from "@/lib/authDb";
import BannerCarousel from "@/components/BannerCarousel";

export const revalidate = 60; // Revalidate every 60 seconds

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  return user;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // Fetch data in parallel on the server
  // Wrap banner fetching in try-catch to handle cases where Banner model doesn't exist yet
  let banners: Awaited<ReturnType<typeof listBanners>> = [];
  try {
    banners = await listBanners(true); // Only get active banners
  } catch (error) {
    // Silently fail if banners can't be loaded (model not generated yet)
    console.warn("Could not load banners:", error);
  }

  const [{ category }, user, products] = await Promise.all([
    searchParams,
    getCurrentUser(),
    listProducts(),
  ]);

  const isAdmin = user?.isAdmin || user?.username === "admin" || false;

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category?.trim())
        .filter((value): value is string => !!value),
    ),
  );

  const filteredProducts = category
    ? products.filter(
        (product) =>
          product.category &&
          product.category.toLowerCase() === category.toLowerCase(),
      )
    : products;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
      {/* Banner Section */}
      <div className="border-b border-zinc-100 bg-white/70">
        <BannerCarousel banners={banners} />
      </div>

      {categories.length > 0 && (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Browse by catalogue
            </p>
          </div>
          {category && (
            <Link
              href="/"
              className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-zinc-800 hover:underline"
            >
              Clear filter
            </Link>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-3">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Link
              href="/"
              className={`flex min-w-[7rem] items-center gap-3 rounded-2xl border px-4 py-2 text-xs font-medium transition ${
                !category
                  ? "border-zinc-900/10 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white/80 text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-white">
                All
              </span>
              <span>All items</span>
            </Link>
            {categories.map((cat) => {
              const isActive =
                category &&
                cat.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  className={`flex min-w-[7rem] items-center gap-3 rounded-2xl border px-4 py-2 text-xs font-medium transition ${
                    isActive
                      ? "border-zinc-900/10 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white/80 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/90 text-[11px] font-semibold text-white">
                    {cat.charAt(0).toUpperCase()}
                  </span>
                  <span className="line-clamp-1">{cat}</span>
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
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">Catalogue</p>
              <h2 className="text-2xl font-semibold text-zinc-900">Available now</h2>
            </div>
            <span className="text-sm text-zinc-500">
              {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"}
              {category ? ` · ${category}` : ""}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-10 text-center shadow-sm">
              <p className="text-zinc-600">
                {category
                  ? "No products in this catalogue yet."
                  : "No products available yet."}
              </p>
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
              {filteredProducts.map((product) => (
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
