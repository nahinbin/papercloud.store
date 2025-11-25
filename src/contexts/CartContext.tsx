"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stockQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Load cart on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Check if user is logged in
        const authRes = await fetch("/api/auth/me");
        const isAuth = authRes.ok;
        setIsLoggedIn(isAuth);

        if (isAuth) {
          // Load from server
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.items)) {
              setItems(data.items);
              // Also save to localStorage as backup
              localStorage.setItem("cart", JSON.stringify(data.items));
            }
          }
        } else {
          // Load from localStorage for guest users
          const saved = localStorage.getItem("cart");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                setItems(parsed);
              }
            } catch (e) {
              console.error("Failed to parse cart from localStorage", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load cart", error);
        // Fallback to localStorage
        const saved = localStorage.getItem("cart");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setItems(parsed);
            }
          } catch (e) {
            console.error("Failed to parse cart from localStorage", e);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save to localStorage whenever items change (for guest users)
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isLoading]);

  // Sync to server when logged in (debounced)
  const syncToServer = useCallback(async (cartItems: CartItem[]) => {
    if (!isLoggedIn || isLoading) return;

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // Handle stock validation errors
        if (errorData.stockErrors && Array.isArray(errorData.stockErrors)) {
          console.error("Stock validation errors:", errorData.stockErrors);
          // Reload cart from server to get corrected quantities
          const cartRes = await fetch("/api/cart");
          if (cartRes.ok) {
            const cartData = await cartRes.json();
            if (Array.isArray(cartData.items)) {
              setItems(cartData.items);
              localStorage.setItem("cart", JSON.stringify(cartData.items));
            }
          }
          // Show error to user (could be improved with toast notifications)
          alert(`Stock validation failed:\n${errorData.stockErrors.join("\n")}`);
        } else {
          console.error("Failed to sync cart to server:", res.status, res.statusText);
        }
      }
    } catch (error) {
      console.error("Failed to sync cart to server", error);
    }
  }, [isLoggedIn, isLoading]);

  // Debounced sync to server
  useEffect(() => {
    if (isLoading || !isLoggedIn) return;

    const timeoutId = setTimeout(() => {
      syncToServer(items);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [items, isLoggedIn, isLoading, syncToServer]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    // Prevent adding out of stock items
    if (item.stockQuantity !== undefined && item.stockQuantity <= 0) {
      return;
    }

    setItems((current) => {
      const existing = current.find((i) => i.productId === item.productId);
      
      if (existing) {
        // Update quantity if item exists
        const newQuantity = existing.quantity + 1;
        // Check stock limit - use the most restrictive stock quantity (existing or new)
        const stockLimit = existing.stockQuantity !== undefined 
          ? (item.stockQuantity !== undefined 
              ? Math.min(existing.stockQuantity, item.stockQuantity)
              : existing.stockQuantity)
          : item.stockQuantity;
        
        if (stockLimit !== undefined && newQuantity > stockLimit) {
          return current; // Don't exceed stock
        }
        return current.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: newQuantity, stockQuantity: stockLimit }
            : i
        );
      } else {
        // Add new item - check stock
        if (item.stockQuantity !== undefined && item.stockQuantity <= 0) {
          return current;
        }
        return [...current, { ...item, quantity: 1 }];
      }
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => {
      const filtered = current.filter((i) => i.productId !== productId);
      return filtered;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) => {
      const item = current.find((i) => i.productId === productId);
      if (!item) return current;

      // Check stock limit - prevent exceeding available stock
      if (item.stockQuantity !== undefined && quantity > item.stockQuantity) {
        // Cap at stock quantity if trying to exceed
        return current.map((i) =>
          i.productId === productId ? { ...i, quantity: item.stockQuantity! } : i
        );
      }

      return current.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
    });
  }, [removeItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
    if (isLoggedIn) {
      try {
        await fetch("/api/cart", { method: "DELETE" });
      } catch (error) {
        console.error("Failed to clear cart on server", error);
      }
    }
  }, [isLoggedIn]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
