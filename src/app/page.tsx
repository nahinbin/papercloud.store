import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { listProducts } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";
import type { Product } from "@/types/product";

export const revalidate = 60; // Revalidate every 60 seconds

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  return user;
}

export default async function Home() {
  // Fetch data in parallel on the server
  const [user, products] = await Promise.all([
    getCurrentUser(),
    listProducts(),
  ]);

  const isAuthed = !!user;
  const isAdmin = user?.isAdmin || user?.username === "admin" || false;
  const username = user?.username || null;

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {isAuthed === true && (
          <p className="mt-2 text-zinc-600">
            Welcome back{username ? `, @${username}` : ""}! Browse our products below.
          </p>
        )}
        {isAuthed === false && (
          <p className="mt-2 text-zinc-600">Browse our products below. <Link href="/login" className="underline">Login</Link> to keep track of your orders.</p>
        )}

        {products.length === 0 ? (
          <div className="mt-8">
            <p className="text-zinc-600">No products available yet.</p>
            {isAdmin && (
              <Link href="/admin/products/new" className="mt-4 inline-block rounded bg-black px-4 py-2 text-white">
                Add First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-lg border p-4 transition-all hover:shadow-xl hover:border-black"
              >
                {product.imageUrl && (
                  <div className="relative mb-3 h-48 w-full overflow-hidden rounded bg-gray-100">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={400}
                      height={300}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      unoptimized={product.imageUrl.startsWith("http")}
                    />
                  </div>
                )}
                {!product.imageUrl && (
                  <div className="mb-3 h-48 w-full rounded bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
                <div className="space-y-2">
                  {product.brand && (
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{product.brand}</p>
                  )}
                  <h3 className="font-semibold text-lg group-hover:underline line-clamp-2">{product.title}</h3>
                  <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
                  {product.stockQuantity !== undefined && (
                    <p className={`text-xs ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
