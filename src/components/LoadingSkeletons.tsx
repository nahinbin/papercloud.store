import type { ReactNode } from "react";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  const classes = ["skeleton rounded-lg animate-pulse bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 bg-[length:200%_100%]", className].filter(Boolean).join(" ");
  return <div aria-hidden className={classes} />;
}

type LoadingPageShellProps = {
  title?: string;
  subtitle?: string;
  widthClassName?: string;
  children: ReactNode;
};

export function LoadingPageShell({
  title,
  subtitle,
  widthClassName = "max-w-6xl",
  children,
}: LoadingPageShellProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white">
      <div className={`mx-auto ${widthClassName} px-4 py-16`}>
        {(title || subtitle) && (
          <div className="mb-12 space-y-3">
            {title && <p className="text-sm uppercase tracking-[0.3em] text-zinc-400">{title}</p>}
            {subtitle && <h1 className="text-3xl font-semibold text-zinc-900">{subtitle}</h1>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-sm space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="space-y-6">
        <Skeleton className="h-[28rem] w-full rounded-3xl" />
      </div>
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-2xl border border-zinc-100 bg-white/70 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardTableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-4">
      <Skeleton className="h-6 w-1/4" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton key={columnIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white/80 p-6 shadow-sm space-y-5">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex justify-end">
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
    </div>
  );
}

