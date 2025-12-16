import { notFound } from "next/navigation";
import Image from "next/image";
import { getCatalogueWithProducts } from "@/lib/catalogueDb";
import type { ProductSummary } from "@/lib/productDb";
import ProductsGrid from "@/app/_components/ProductsGrid";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 300; // Revalidate every 5 minutes (data is cached in DB layer)

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCatalogueWithProducts(slug);

  if (!result) {
    notFound();
  }

  const { catalogue, products } = result as { catalogue: any; products: ProductSummary[] };
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || value;
  const categorySlug = encodeURIComponent(slugify(catalogue.slug ?? catalogue.title ?? catalogue.id));
  const categoryHref = `/${categorySlug}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: "Store", href: "/" },
            { label: catalogue.title, href: categoryHref },
          ]}
        />

        {/* Category banner (similar feel to home page banner, but single image) */}
        {catalogue.imageUrl && (
          <div className="relative w-full overflow-hidden rounded-3xl border border-zinc-100 bg-white/60 shadow-sm banner-item">
            <Image
              src={catalogue.imageUrl}
              alt={catalogue.title}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 1000px, 100vw"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
        )}

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Category</p>
          <h1 className="mt-2 text-3xl font-semibold">{catalogue.title}</h1>
          {catalogue.description && <p className="mt-3 text-zinc-600">{catalogue.description}</p>}
          {catalogue.content && (
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{catalogue.content}</div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-zinc-200 bg-white/70 p-10 text-center shadow-sm">
            <p className="text-zinc-600">No products have been assigned to this category yet.</p>
          </div>
        ) : (
          <div className="mt-12">
            <ProductsGrid initialProducts={products} initialNextCursor={null} isAdmin={false} />
          </div>
        )}
      </div>
    </div>
  );
}


