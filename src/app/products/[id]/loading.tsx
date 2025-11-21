import { LoadingPageShell, ProductDetailSkeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Product" subtitle="Loading details" widthClassName="max-w-6xl">
      <ProductDetailSkeleton />
    </LoadingPageShell>
  );
}

