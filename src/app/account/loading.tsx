import { LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Account" subtitle="Fetching your details" widthClassName="max-w-4xl">
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </LoadingPageShell>
  );
}

