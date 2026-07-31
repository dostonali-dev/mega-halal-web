"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";

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
  keywords?: string | null;
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
      try {
        const data = await fetchAllRows<any>("products", "id", false);
        // "hidden" ustuni bazada bo'lmasa ham xatolik chiqmasligi uchun
        // client tomonda filtrlaymiz (mijozlarga yashirilgan mahsulotlar ko'rinmasin).
        setProducts(data.filter((p: any) => p.hidden !== true));
      } catch (error) {
        console.error(error);
      }
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
    if (!product) return Infinity;
    // "Sotuvda yo'q" deb belgilangan mahsulot - umuman qo'shib bo'lmaydi.
    if (product.in_stock === false) return 0;
    // "Soni" maydoni son sifatida kiritilgan bo'lsa (0 ham kiradi) - shu son
    // qat'iy chegara. Umuman kiritilmagan (null) bo'lsa - inventar
    // kuzatilmayapti degani, cheksiz deb hisoblaymiz.
    if (product.stock == null) return Infinity;
    return Math.max(0, product.stock);
  };

  const addToCart = (id: number) => {
    const product = products.find((p) => p.id === id);
    const max = getMaxQty(id);
    if (max === 0) {
      alert("Bu mahsulot hozircha sotuvda yo'q 😔");
      return;
    }
    const current = cart[id] || 0;
    if (current >= max) {
      alert(`Afsuski, "${product?.name || "bu mahsulot"}"dan faqat ${max} dona bor.`);
      return;
    }
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => ({ ...prev, [id]: Math.max((prev[id] || 0) - 1, 0) }));
  };

  const setQty = (id: number, qty: number) => {
    const max = getMaxQty(id);
    if (max !== Infinity && qty > max) {
      const product = products.find((p) => p.id === id);
      if (max === 0) {
        alert("Bu mahsulot hozircha sotuvda yo'q 😔");
      } else {
        alert(`Afsuski, "${product?.name || "bu mahsulot"}"dan faqat ${max} dona bor.`);
      }
    }
    setCart((prev) => {
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