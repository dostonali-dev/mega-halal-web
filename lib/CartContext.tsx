"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
};

type CartContextType = {
  products: Product[];
  cart: Record<number, number>;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});

  // Load cart from browser storage so it survives page navigation
  useEffect(() => {
    const stored = localStorage.getItem("mhs_cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mhs_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error(error);
        return;
      }
      setProducts(data || []);
    };
    loadProducts();
  }, []);

  const addToCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));
  };

  const clearCart = () => setCart({});

  const total = products.reduce(
    (sum, item) => sum + item.price * (cart[item.id] || 0),
    0
  );
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  return (
    <CartContext.Provider
      value={{ products, cart, addToCart, removeFromCart, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}