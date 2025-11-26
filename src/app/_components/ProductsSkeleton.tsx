const cards = Array.from({ length: 8 });

export default function ProductsSkeleton() {
  return (
    <section className="space-y-5 pb-16 pt-10">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" />
        <div className="h-4 w-16 rounded-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white/70 shadow-sm"
          >
            <div className="relative aspect-[20/21] w-full overflow-hidden bg-zinc-100 animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" style={{ animationDelay: `${index * 50}ms` }} />
            <div className="space-y-2 px-3 py-2.5">
              <div className="h-3 w-20 rounded-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" style={{ animationDelay: `${index * 50 + 100}ms` }} />
              <div className="h-5 w-full rounded-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" style={{ animationDelay: `${index * 50 + 150}ms` }} />
              <div className="h-6 w-24 rounded-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" style={{ animationDelay: `${index * 50 + 200}ms` }} />
              <div className="h-3 w-28 rounded-full animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]" style={{ animationDelay: `${index * 50 + 250}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


