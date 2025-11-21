import { DashboardTableSkeleton, LoadingPageShell } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Admin · Products" subtitle="Listing products" widthClassName="max-w-6xl">
      <DashboardTableSkeleton rows={6} columns={5} />
    </LoadingPageShell>
  );
}

