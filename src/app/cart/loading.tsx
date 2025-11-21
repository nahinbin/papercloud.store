import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Cart" subtitle="Reviewing your bag" widthClassName="max-w-4xl">
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-sm sm:flex-row"
          >
            <Skeleton className="h-28 w-full rounded-xl sm:h-24 sm:w-24" />
            <div className="flex flex-1 flex-col justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-9 w-40 rounded-full" />
            </div>
            <div className="flex w-full flex-col items-end gap-2 sm:w-auto">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
        <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-full rounded-full" />
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      </div>
    </LoadingPageShell>
  );
}

