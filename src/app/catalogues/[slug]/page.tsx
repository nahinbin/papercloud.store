import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogueWithProducts } from "@/lib/catalogueDb";

export const revalidate = 60;

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCatalogueWithProducts(slug);

  if (!result) {
    notFound();
  }

  const { catalogue, products } = result;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Back to store
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Catalogue</p>
            <h1 className="mt-2 text-3xl font-semibold">{catalogue.title}</h1>
            {catalogue.description && <p className="mt-3 text-zinc-600">{catalogue.description}</p>}
            {catalogue.content && (
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{catalogue.content}</div>
            )}
          </div>
          {catalogue.imageUrl && (
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-zinc-100">
              <Image
                src={catalogue.imageUrl}
                alt={catalogue.title}
                fill
                className="object-cover"
                unoptimized={catalogue.imageUrl?.startsWith("http") ?? false}
              />
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center shadow-sm">
            <p className="text-zinc-600">No products have been assigned to this catalogue yet.</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: any) => (
              <Link
                href={`/products/${product.id}`}
                key={product.id}
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
                      unoptimized={product.imageUrl?.startsWith("http") ?? false}
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

