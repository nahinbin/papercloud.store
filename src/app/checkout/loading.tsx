import { FormSkeleton, LoadingPageShell, Skeleton } from "@/components/LoadingSkeletons";

export default function Loading() {
  return (
    <LoadingPageShell title="Checkout" subtitle="Securing payment details" widthClassName="max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <FormSkeleton fields={5} />
        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm">
          <Skeleton className="h-4 w-1/3" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <div className="border-t pt-4">
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </LoadingPageShell>
  );
}

