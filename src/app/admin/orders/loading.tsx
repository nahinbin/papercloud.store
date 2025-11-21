import { DashboardTableSkeleton, LoadingPageShell } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Admin · Orders" subtitle="Syncing orders" widthClassName="max-w-6xl">
      <DashboardTableSkeleton rows={5} columns={4} />
    </LoadingPageShell>
  );
}

