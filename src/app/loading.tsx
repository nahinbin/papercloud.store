import { LoadingPageShell, ProductGridSkeleton, Skeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="PaperCloud" subtitle="Curating products for you">
      <div className="space-y-8">
        <div className="rounded-3xl border border-zinc-100 bg-white/80 p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <Skeleton className="h-24 w-full rounded-2xl md:col-span-2" />
            <Skeleton className="h-24 w-full rounded-2xl md:col-span-1" />
            <Skeleton className="h-24 w-full rounded-2xl md:col-span-1" />
          </div>
        </div>
        <ProductGridSkeleton count={6} />
      </div>
    </LoadingPageShell>
  );
}