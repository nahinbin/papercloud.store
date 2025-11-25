import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogueWithProducts } from "@/lib/catalogueDb";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 300; // Revalidate every 5 minutes (data is cached in DB layer)

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
        <Breadcrumbs className="mb-4" />

        <div className="mt-6 grid gap-8 md:grid-cols-[2fr,1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Category</p>
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
                priority
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 100vw"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center shadow-sm">
            <p className="text-zinc-600">No products have been assigned to this category yet.</p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product: any, index: number) => (
              <Link
                href={`/products/${product.id}`}
                key={product.id}
                prefetch={index < 6}
                className="group rounded-3xl border border-zinc-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {product.imageUrl ? (
                  <div className="relative mb-4 h-48 w-full overflow-hidden rounded-2xl bg-zinc-100">
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

