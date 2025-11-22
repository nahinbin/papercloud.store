"use client";

import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  stockQuantity?: number;
  selectedColor?: string;
  selectedSize?: string;
}

export default function AddToCartButton({ 
  productId, 
  title, 
  price, 
  imageUrl, 
  stockQuantity,
  selectedColor,
  selectedSize,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();

  const handleAddToCart = () => {
    if (!productId) return;
    
    // Build title with variants
    let itemTitle = title;
    if (selectedColor || selectedSize) {
      const variants = [];
      if (selectedColor) variants.push(selectedColor);
      if (selectedSize) variants.push(selectedSize);
      itemTitle = `${title} (${variants.join(", ")})`;
    }
    
    addItem({
      productId,
      title: itemTitle,
      price,
      imageUrl,
      stockQuantity,
    });
    
    // Optional: Show a toast or redirect to cart
    // For now, just add to cart silently
  };

  if (stockQuantity === 0) {
    return (
      <button
        disabled
        className="w-full py-4 rounded-lg font-semibold text-lg bg-gray-300 text-gray-500 cursor-not-allowed"
      >
        Out of Stock
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        className="w-full py-4 rounded-lg font-semibold text-lg bg-black text-white hover:bg-gray-800"
      >
        Add to Cart
      </button>
      <p className="text-xs text-zinc-500 mt-2 text-center">
        Secure checkout • Free returns • Fast shipping
      </p>
    </div>
  );
}

