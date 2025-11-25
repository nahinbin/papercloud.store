import { Suspense } from "react";
import BannerSection from "./_components/BannerSection";
import BannerSkeleton from "./_components/BannerSkeleton";
import CataloguesSection from "./_components/CataloguesSection";
import CataloguesSkeleton from "./_components/CataloguesSkeleton";
import ProductsSection from "./_components/ProductsSection";
import ProductsSkeleton from "./_components/ProductsSkeleton";

// Use ISR (Incremental Static Regeneration) for better performance
// Revalidate every 60 seconds - banners and products don't change that frequently
export const revalidate = 60;

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