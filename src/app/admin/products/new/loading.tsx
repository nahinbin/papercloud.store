import { FormSkeleton, LoadingPageShell } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Admin · Products" subtitle="Opening new product form" widthClassName="max-w-3xl">
      <FormSkeleton fields={8} />
    </LoadingPageShell>
  );
}

