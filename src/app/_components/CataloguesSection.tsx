import Image from "next/image";
import Link from "next/link";
import { listActiveCatalogueSummaries } from "@/lib/catalogueDb";

export default async function CataloguesSection() {
  const catalogues = await listActiveCatalogueSummaries();

  if (!catalogues.length) {
    return null;
  }

  return (
    <section className="pt-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Catalogues</p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
        {catalogues.map((catalogue) => {
          const href = catalogue.linkUrl || `/catalogues/${encodeURIComponent(catalogue.slug ?? catalogue.id)}`;

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
                  sizes="(min-width: 1280px) 12.5vw, (min-width: 1024px) 14vw, (min-width: 768px) 16vw, (min-width: 640px) 18vw, 25vw"
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
    </section>
  );
}


