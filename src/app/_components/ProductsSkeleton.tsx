const cards = Array.from({ length: 6 });

export default function ProductsSkeleton() {
  return (
    <section className="space-y-5 pb-16 pt-10">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 rounded-full bg-zinc-100" />
        <div className="h-4 w-16 rounded-full bg-zinc-100" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="rounded-3xl border border-zinc-100 bg-white/80 p-4 shadow-sm"
          >
            <div className="mb-4 h-48 w-full rounded-2xl bg-zinc-100" />
            <div className="space-y-3">
              <div className="h-3 w-20 rounded-full bg-zinc-100" />
              <div className="h-5 w-3/4 rounded-full bg-zinc-100" />
              <div className="h-5 w-24 rounded-full bg-zinc-100" />
              <div className="h-3 w-32 rounded-full bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


