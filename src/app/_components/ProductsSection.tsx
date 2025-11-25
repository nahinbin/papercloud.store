import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { listHomeProducts } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}

export default async function ProductsSection() {
  const [products, user] = await Promise.all([listHomeProducts(), getCurrentUser()]);

  const isAdmin = Boolean(user?.isAdmin || user?.username === "admin");

  return (
    <section id="products" className="space-y-5 pb-16 pt-10" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Available now</h2>
        </div>
        <span className="text-sm text-zinc-500">
          {products.length} item{products.length === 1 ? "" : "s"}
        </span>
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              prefetch={index < 6}
              className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              {product.imageUrl ? (
                <div className="relative aspect-[20/21] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    priority={index < 3}
                    loading={index < 3 ? "eager" : "lazy"}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
              ) : (
                <div className="flex aspect-[20/21] w-full items-center justify-center border border-dashed border-zinc-200 bg-zinc-50">
                  <span className="text-sm text-zinc-400">No image</span>
                </div>
              )}
              <div className="space-y-2 px-3 py-2.5">
                {product.brand && (
                  <p className="text-xs uppercase tracking-[0.23em] text-zinc-400">{product.brand}</p>
                )}
                <h3 className="line-clamp-2 text-lg font-semibold text-zinc-900 group-hover:text-black">
                  {product.title}
                </h3>
                <p className="text-xl font-bold text-zinc-900">${product.price.toFixed(2)}</p>
                {typeof product.stockQuantity === "number" && (
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
  );
}


