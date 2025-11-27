"use client";

import { useState } from "react";
import ProductVariants from "./ProductVariants";
import AddToCartButton from "./AddToCartButton";

interface ProductPageClientProps {
  colorVariants?: string[];
  sizeVariants?: string[];
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  stockQuantity?: number;
}

export default function ProductPageClient({
  colorVariants,
  sizeVariants,
  productId,
  title,
  price,
  imageUrl,
  stockQuantity,
}: ProductPageClientProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    colorVariants && colorVariants.length > 0 ? colorVariants[0] : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    sizeVariants && sizeVariants.length > 0 ? sizeVariants[0] : undefined
  );
  const hasVariants =
    (colorVariants && colorVariants.length > 0) ||
    (sizeVariants && sizeVariants.length > 0);

  const Actions = ({ className }: { className?: string }) => (
    <div className={className}>
      <AddToCartButton
        productId={productId}
        title={title}
        price={price}
        imageUrl={imageUrl}
        stockQuantity={stockQuantity}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {hasVariants && (
        <div className="rounded-3xl border border-zinc-100 bg-white/90 p-5 shadow-sm backdrop-blur">
          <ProductVariants
            colorVariants={colorVariants}
            sizeVariants={sizeVariants}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            onColorSelect={setSelectedColor}
            onSizeSelect={setSelectedSize}
          />
        </div>
      )}

      <div className="hidden lg:block">
        <Actions />
      </div>

      <div className="lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-[0_-18px_45px_rgba(15,23,42,0.18)] backdrop-blur-md">
          <div className="mx-auto max-w-6xl">
            <Actions />
          </div>
        </div>
      </div>
    </div>
  );
}

