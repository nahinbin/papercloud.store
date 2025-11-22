import BannerCarousel from "@/components/BannerCarousel";
import { listActiveBannerSummaries } from "@/lib/bannerDb";

export default async function BannerSection() {
  const banners = await listActiveBannerSummaries();

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-zinc-100 bg-white/70" suppressHydrationWarning>
      <BannerCarousel banners={banners} />
    </div>
  );
}


