"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogueSummary } from "@/lib/catalogueDb";

const MOBILE_LIMIT = 8;
const DESKTOP_LIMIT = 16;

interface CatalogueGridProps {
  catalogues: CatalogueSummary[];
}

export default function CatalogueGrid({ catalogues }: CatalogueGridProps) {
  const [showAll, setShowAll] = useState(false);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || value;

  return (
    <>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
        {catalogues.map((catalogue, index) => {
          const derivedSlug = slugify(catalogue.slug ?? catalogue.title ?? catalogue.id);
          const slug = encodeURIComponent(derivedSlug);
          const href = `/${slug}`;
          const beyondMobileLimit = index >= MOBILE_LIMIT;
          const beyondDesktopLimit = index >= DESKTOP_LIMIT;

          let visibilityClass = "";
          if (!showAll) {
            if (beyondDesktopLimit) {
              visibilityClass = "hidden";
            } else if (beyondMobileLimit) {
              visibilityClass = "hidden lg:block";
            }
          }

          return (
            <Link
              key={catalogue.id}
              href={href}
              prefetch={false}
              className={`group relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 ${visibilityClass}`}
            >
              {catalogue.imageUrl ? (
                <Image
                  src={catalogue.imageUrl}
                  alt={catalogue.title}
                  fill
                  priority={index < 12}
                  loading={index < 12 ? "eager" : "lazy"}
                  fetchPriority={index < 12 ? "high" : "auto"}
                  className="object-cover"
                  sizes="(min-width: 1280px) 12.5vw, (min-width: 1024px) 14vw, (min-width: 768px) 16vw, (min-width: 640px) 18vw, 25vw"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 text-xl font-semibold text-zinc-300">
                  {catalogue.title.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 px-2 pb-2 pt-1 text-white">
                <p className="text-[11px] font-semibold leading-tight line-clamp-1">{catalogue.title}</p>
                {catalogue.description && (
                  <p className="text-[10px] text-white/80 line-clamp-1">{catalogue.description}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {catalogues.length > DESKTOP_LIMIT && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            {showAll ? (
              <>
                <span>Show less</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>See more</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

