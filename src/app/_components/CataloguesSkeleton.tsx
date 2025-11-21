const placeholders = Array.from({ length: 8 });

export default function CataloguesSkeleton() {
  return (
    <section className="pt-6">
      <div className="text-center">
        <div className="mx-auto h-3 w-32 rounded-full bg-zinc-100" />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
        {placeholders.map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="aspect-square w-full animate-pulse rounded-xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-100"
          />
        ))}
      </div>
    </section>
  );
}


