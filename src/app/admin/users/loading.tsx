import { DashboardTableSkeleton, LoadingPageShell } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Admin · Users" subtitle="Gathering user list" widthClassName="max-w-6xl">
      <DashboardTableSkeleton rows={6} columns={4} />
    </LoadingPageShell>
  );
}

