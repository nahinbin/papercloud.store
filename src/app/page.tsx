import { Suspense } from "react";
import BannerSection from "./_components/BannerSection";
import BannerSkeleton from "./_components/BannerSkeleton";
import CataloguesSection from "./_components/CataloguesSection";
import CataloguesSkeleton from "./_components/CataloguesSkeleton";
import ProductsSection from "./_components/ProductsSection";
import ProductsSkeleton from "./_components/ProductsSkeleton";

export const revalidate = 300; // Revalidate every 5 minutes (data is cached in DB layer)

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 via-white to-white text-zinc-900" suppressHydrationWarning>
      <Suspense fallback={<BannerSkeleton />}>
        <BannerSection />
      </Suspense>
      <div className="mx-auto max-w-6xl px-4">
        <Suspense fallback={<CataloguesSkeleton />}>
          <CataloguesSection />
        </Suspense>
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsSection />
        </Suspense>
      </div>
    </div>
  );
}