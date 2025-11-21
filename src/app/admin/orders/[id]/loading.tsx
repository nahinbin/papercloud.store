import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Admin · Order" subtitle="Opening order details" widthClassName="max-w-4xl">
      <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </LoadingPageShell>
  );
}

