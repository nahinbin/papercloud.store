"use client";

import { useCart } from "@/contexts/CartContext";

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
  const { addItem, items } = useCart();

  // Check if product is out of stock
  const isOutOfStock = stockQuantity !== undefined && stockQuantity <= 0;
  
  // Check current quantity in cart
  const cartItem = items.find((i) => i.productId === productId);
  const currentQuantity = cartItem?.quantity || 0;
  
  // Check if we can add more (considering stock limit)
  // Must have at least 1 available after adding (currentQuantity + 1 <= stockQuantity)
  const canAddMore = stockQuantity === undefined || (currentQuantity + 1) <= stockQuantity;
  const isDisabled = isOutOfStock || !canAddMore;

  const handleAddToCart = () => {
    if (!productId || isDisabled) return;
    
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
  };

  if (isOutOfStock) {
    return (
      <div>
        <button
          disabled
          className="w-full py-4 rounded-lg font-semibold text-lg bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-50"
        >
          Out of Stock
        </button>
        <p className="text-xs text-zinc-400 mt-2 text-center">
          This item is currently unavailable
        </p>
      </div>
    );
  }

  if (!canAddMore) {
    return (
      <div>
        <button
          disabled
          className="w-full py-4 rounded-lg font-semibold text-lg bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-50"
        >
          Maximum Quantity Reached
        </button>
        <p className="text-xs text-zinc-400 mt-2 text-center">
          Only {stockQuantity} available in stock
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleAddToCart}
        disabled={isDisabled}
        className="w-full py-4 rounded-lg font-semibold text-lg bg-black text-white hover:bg-zinc-800 transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add to Cart
      </button>
      <p className="text-xs text-zinc-500 mt-2 text-center">
        Secure checkout • Free returns • Fast shipping
      </p>
    </div>
  );
}

