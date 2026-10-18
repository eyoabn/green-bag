"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/components/CurrencyContext";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  ShieldCheck,
  Truck
} from "lucide-react";

export default function CartDrawer() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart, 
    isCartOpen, 
    setIsCartOpen, 
    totalItems, 
    subtotal 
  } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" 
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          ref={drawerRef}
          className="w-screen max-w-md bg-[#FAF7F2] border-l border-stone-200 shadow-2xl flex flex-col transform transition-transform ease-out duration-300"
        >
          {/* Header */}
          <div className="p-6 border-b border-stone-200/80 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1E3B2E]/10 flex items-center justify-center text-[#1E3B2E]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-stone-900">Your Packaging Cart</h2>
                <p className="text-xs text-stone-500 font-medium">
                  {totalItems} {totalItems === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-800">Your cart is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mt-1 mb-6">
                  Explore our artisan kraft paper packaging line and add items to your cart.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push("/products");
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#1E3B2E] text-white text-xs font-bold hover:bg-[#8C4B31] transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Browse Product Catalog</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.productId}
                  className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex gap-3.5 items-center transition-all hover:border-stone-300"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    <img 
                      src={item.image || "/images/photo_6_2026-09-05_00-36-03.jpg"} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{item.name}</h4>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {item.category && (
                      <span className="text-[10px] text-stone-500 font-medium block">
                        {item.category}
                      </span>
                    )}

                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity Controller */}
                      <div className="flex items-center border border-stone-200 rounded-full bg-stone-50 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line price */}
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#1E3B2E]">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {formatPrice(item.price)} each
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Checkout Actions */}
          {items.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-stone-200 bg-white space-y-4 pb-safe">
              {/* Delivery and Guarantee Badges */}
              <div className="flex items-center justify-between text-xs text-stone-500 px-1">
                <span className="flex items-center gap-1.5">
                  <Truck size={14} className="text-[#8C4B31]" />
                  Delivery Included
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  Bank Settlement
                </span>
              </div>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between pt-2 border-t border-stone-100">
                <span className="text-xs font-medium text-stone-600">Total</span>
                <span className="font-serif text-xl font-bold text-stone-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push("/checkout");
                  }}
                  className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Checkout</span>
                  <ArrowRight size={15} />
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearCart}
                    className="text-xs text-stone-400 hover:text-red-500 transition-colors py-2"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-medium py-2"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
