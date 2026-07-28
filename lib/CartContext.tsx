"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  in_stock?: boolean;
  stock?: number;
  discount_price?: number | null;
  is_hot?: boolean | null;
  hidden?: boolean | null;
};
export type Category = {
  id: number;
  name: string;
  icon: string | null;
  image_url?: string | null;
  sort_order?: number | null;
};

type CartContextType = {
  products: Product[];
  categories: Category[];
  cart: Record<number, number>;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  getMaxQty: (id: number) => number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});

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
    // Foydalanuvchi chiqib ketganda (signOut), avvalgi akkauntning savatchasi
    // mehmon rejimida yoki keyingi foydalanuvchida ko'rinib qolmasligi uchun tozalaymiz.
    const handleSignedOut = () => setCart({});
    window.addEventListener("mhs-signed-out", handleSignedOut);
    return () => window.removeEventListener("mhs-signed-out", handleSignedOut);
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error(error);
        return;
      }
      // "hidden" ustuni bazada bo'lmasa ham xatolik chiqmasligi uchun
      // client tomonda filtrlaymiz (mijozlarga yashirilgan mahsulotlar ko'rinmasin).
      setProducts((data || []).filter((p: any) => p.hidden !== true));
    };
    loadProducts();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadProducts();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      setCategories(data || []);
    };
    loadCategories();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCategories();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const getMaxQty = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product || product.stock == null) return Infinity;
    return Math.max(0, product.stock);
  };

  const addToCart = (id: number) => {
    setCart((prev) => {
      const max = getMaxQty(id);
      const current = prev[id] || 0;
      if (current >= max) return prev;
      return { ...prev, [id]: current + 1 };
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));
  };

  const setQty = (id: number, qty: number) => {
    setCart((prev) => {
      const max = getMaxQty(id);
      const clamped = Math.min(Math.max(0, qty), max);
      const next = { ...prev };
      if (clamped <= 0) {
        delete next[id];
      } else {
        next[id] = clamped;
      }
      return next;
    });
  };

  const clearCart = () => setCart({});

  const total = products.reduce(
    (sum, item) => sum + item.price * (cart[item.id] || 0),
    0
  );
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  return (
    <CartContext.Provider
      value={{ products, categories, cart, addToCart, removeFromCart, setQty, clearCart, total, itemCount, getMaxQty }}
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