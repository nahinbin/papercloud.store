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
  // Auto-select first variant if only one option, or if multiple options exist
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    colorVariants && colorVariants.length > 0 ? colorVariants[0] : undefined
  );
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    sizeVariants && sizeVariants.length > 0 ? sizeVariants[0] : undefined
  );

  return (
    <>
      {/* Variants Selection */}
      <ProductVariants
        colorVariants={colorVariants}
        sizeVariants={sizeVariants}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        onColorSelect={setSelectedColor}
        onSizeSelect={setSelectedSize}
      />

      {/* Buy Button */}
      <div className="pt-4">
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
    </>
  );
}

