"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageGalleryProps {
  images: string[];
  productTitle: string;
}

export default function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-lg border flex items-center justify-center">
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }

  const currentImage = images[selectedImageIndex];

  return (
    <div className="space-y-4 lg:sticky lg:top-8">
      {/* Main Image */}
      <div className="relative w-full aspect-square sm:aspect-[7/8] lg:aspect-[6/7] xl:aspect-[7/8] 2xl:aspect-[8/9] rounded-3xl border border-zinc-200 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)] overflow-hidden">
        <Image
          src={currentImage}
          alt={`${productTitle} - Image ${selectedImageIndex + 1}`}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={selectedImageIndex === 0}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHhYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQADAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        
        {/* Navigation Arrows (if more than 1 image) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <>
          <div className="hidden md:grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square rounded-2xl border-2 overflow-hidden transition ${
                  selectedImageIndex === index
                    ? "border-black ring-2 ring-black ring-offset-2"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 12.5vw, 25vw"
                />
              </button>
            ))}
          </div>
          <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {images.map((image, index) => (
              <button
                key={`mobile-${index}`}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative h-16 w-16 flex-shrink-0 rounded-2xl border-2 overflow-hidden transition ${
                  selectedImageIndex === index
                    ? "border-black"
                    : "border-zinc-200 hover:border-zinc-400"
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${productTitle} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

