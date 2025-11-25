import { LoadingPageShell, ProductGridSkeleton } from "@/components/LoadingSkeletons";
import { Skeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Category" subtitle="Loading products" widthClassName="max-w-5xl">
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>

        {/* Products Grid Skeleton */}
        <ProductGridSkeleton count={9} />
      </div>
    </LoadingPageShell>
  );
}

