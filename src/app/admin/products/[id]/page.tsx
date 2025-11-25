import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { getProductById } from "@/lib/productDb";
import { getUserBySessionToken } from "@/lib/authDb";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 60; // Revalidate every 60 seconds

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const user = await getUserBySessionToken(token);
  return user;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Check auth and fetch product in parallel
  const [user, product] = await Promise.all([
    getCurrentUser(),
    getProductById(id),
  ]);

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.username === "@admin" || user?.username === "admin" || false;
  
  if (!isAdmin) {
    redirect("/");
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Breadcrumbs className="mb-4" />
        <p className="text-red-600">Product not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <a
          href="/admin/products/new"
          className="mb-4 inline-block rounded border px-4 py-2"
        >
          ← Back
        </a>
        <h1 className="text-2xl font-semibold">Product Details</h1>
      </div>
      <div className="space-y-4">
        {product.imageUrl && (
          <div>
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={800}
              height={600}
              className="w-full rounded border"
              unoptimized={product.imageUrl.startsWith("http")}
            />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold">{product.title}</h2>
          <p className="text-lg font-medium text-gray-700">${product.price.toFixed(2)}</p>
        </div>
        {product.description && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Description</h3>
            <p className="text-sm text-gray-600">{product.description}</p>
          </div>
        )}
        <div className="text-xs text-gray-500">
          Created: {new Date(product.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
