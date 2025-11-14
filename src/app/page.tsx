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
  const isAdmin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
  const username = user?.username || null;

  return (
    <div className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-2xl font-semibold">PaperCloud Store</h1>
        {isAuthed === true && (
          <p className="mt-2 text-zinc-600">
            Welcome back{username ? `, @${username}` : ""}! Browse our products below.
          </p>
        )}
        {isAuthed === false && (
          <p className="mt-2 text-zinc-600">Browse our products below. <Link href="/login" className="underline">Login</Link> or <Link href="/register" className="underline">register</Link> if you wish to create an account.</p>
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
                href={`/admin/products/${product.id}`}
                className="group rounded border p-4 transition-shadow hover:shadow-lg"
              >
                {product.imageUrl && (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    width={400}
                    height={300}
                    className="mb-3 h-48 w-full rounded object-cover"
                    unoptimized={product.imageUrl.startsWith("http")}
                  />
                )}
                <h3 className="font-semibold group-hover:underline">{product.title}</h3>
                <p className="mt-1 text-lg font-medium">${product.price.toFixed(2)}</p>
                {product.description && (
                  <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{product.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
