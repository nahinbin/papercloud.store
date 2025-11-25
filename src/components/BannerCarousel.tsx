"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Banner {
  id: string;
  title?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  desktopImageUrl?: string;
  linkUrl?: string;
  order: number;
  isActive?: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Simple auto-scroll
  useEffect(() => {
    if (banners.length <= 1) return;

    const startAutoScroll = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          setCurrentIndex((prev) => (prev + 1) % banners.length);
        }
      }, 4000); // 4 seconds
    };

    startAutoScroll();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners.length, isPaused]);

  // Scroll to current index
  useEffect(() => {
    if (scrollContainerRef.current) {
      const bannerWidth = scrollContainerRef.current.clientWidth;
      const scrollPosition = currentIndex * bannerWidth;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <div
      className="banner-carousel w-full overflow-x-auto bg-gray-50 snap-x snap-mandatory scroll-smooth"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={scrollContainerRef}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      suppressHydrationWarning
    >
      <div className="flex">
        {banners.map((banner, index) => {
          const priority = index === 0;
          const mobileSrc = banner.mobileImageUrl || banner.imageUrl || banner.desktopImageUrl;
          const desktopSrc = banner.desktopImageUrl || banner.imageUrl || banner.mobileImageUrl;
          const hasAnyImage = mobileSrc || desktopSrc;
          
          // Preload next banner image for smoother transitions
          const shouldPreload = index === 1 && banners.length > 1;

          const BannerContent = (
            <div className="flex-shrink-0 w-screen relative overflow-hidden bg-gray-200 snap-start snap-always banner-item">
              {/* Mobile Image */}
              {mobileSrc && (
                <Image
                  src={mobileSrc}
                  alt={banner.title || "Banner"}
                  fill
                  priority={priority}
                  fetchPriority={priority ? "high" : "auto"}
                  className="object-cover md:hidden"
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              )}
              {/* Desktop Image */}
              {desktopSrc && (
                <Image
                  src={desktopSrc}
                  alt={banner.title || "Banner"}
                  fill
                  priority={priority}
                  fetchPriority={priority ? "high" : "auto"}
                  className="object-cover hidden md:block"
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              )}
              {/* No image fallback */}
              {!hasAnyImage && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
          );

          if (banner.linkUrl) {
            return (
              <Link key={banner.id} href={banner.linkUrl} className="block flex-shrink-0 w-screen snap-start snap-always">
                {BannerContent}
              </Link>
            );
          }

          return (
            <div key={banner.id} className="flex-shrink-0 w-screen snap-start snap-always">
              {BannerContent}
            </div>
          );
        })}
      </div>
    </div>
  );
}

