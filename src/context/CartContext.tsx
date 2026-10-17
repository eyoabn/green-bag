"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string; // product ID
  productId: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  quantity: number;
  stock_quantity?: number;
  bundleSize?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "arenguade_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate structure
          const valid = parsed.filter(
            (i) => i && typeof i.productId === "string" && typeof i.price === "number" && i.quantity > 0
          );
          setItems(valid);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from storage:", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to storage:", e);
    }
  }, [items, isInitialized]);

  // Add item with quantity limits validation
  const addItem = (item: Omit<CartItem, "quantity">, qty: number = 1) => {
    const validQty = Math.max(1, Math.min(1000, Math.floor(qty)));
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === item.productId || i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(1000, updated[existingIndex].quantity + validQty);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            ...item,
            productId: item.productId || item.id,
            id: item.productId || item.id,
            quantity: validQty,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    const validQty = Math.floor(quantity);
    if (validQty <= 0) {
      removeItem(productId);
      return;
    }
    const clampedQty = Math.min(1000, validQty);
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId || i.id === productId ? { ...i, quantity: clampedQty } : i
      )
    );
  };

  // Remove item
  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId && i.id !== productId));
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
