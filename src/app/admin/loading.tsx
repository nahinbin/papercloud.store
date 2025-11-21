import { DashboardTableSkeleton, LoadingPageShell } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Admin" subtitle="Loading dashboard" widthClassName="max-w-6xl">
      <DashboardTableSkeleton rows={4} columns={4} />
    </LoadingPageShell>
  );
}

