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
  parent_product_id?: number | null;
  variant_name?: string | null;
  gram?: number | null;
  weight_unit?: string | null;
  manufacturer?: string | null;
  expiry_date?: string | null;
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
    // Ilova fonga o'tib (masalan ekran o'chib yoki boshqa ilovaga
    // o'tilib) qaytganda, ba'zida tarmoq hali to'liq tiklanmagan bo'ladi
    // va shu lahzadagi so'rov vaqtincha bo'sh natija bilan qaytishi mumkin.
    // Avval muvaffaqiyatli yuklangan ro'yxatni shunday vaqtinchalik bo'sh
    // natija bilan ustidan yozib yubormaslik uchun - va bo'sh/xato bo'lsa
    // bir necha soniyadan keyin avtomatik qayta urinish uchun - shu yordamchi
    // funksiyani ishlatamiz. Aks holda foydalanuvchi ilovadan chiqib qayta
    // kirishga majbur bo'lar edi.
    let cancelled = false;
    const loadProducts = async (attempt = 0) => {
      try {
        const data = await fetchAllRows<any>("products", "id", false);
        if (cancelled) return;
        // "hidden" ustuni bazada bo'lmasa ham xatolik chiqmasligi uchun
        // client tomonda filtrlaymiz (mijozlarga yashirilgan mahsulotlar ko'rinmasin).
        const filtered = data.filter((p: any) => p.hidden !== true);
        if (filtered.length === 0 && attempt < 3) {
          setTimeout(() => loadProducts(attempt + 1), 1500);
          return;
        }
        setProducts((prev) => {
          if (filtered.length === 0 && prev.length > 0) return prev;
          return filtered;
        });
      } catch (error) {
        console.error(error);
        if (!cancelled && attempt < 3) {
          setTimeout(() => loadProducts(attempt + 1), 1500);
        }
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

    // Capacitor'dagi tabiiy ilova (Android/iOS) ba'zida fondan qaytganda
    // brauzerdagi "visibilitychange"/"focus" hodisalarini chiqarmaydi -
    // shuning uchun ilova resume bo'lganda ham qayta yuklaymiz.
    let removeResumeListener: (() => void) | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("resume", () => loadProducts());
        removeResumeListener = () => handle.remove();
      } catch {}
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      removeResumeListener?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCategories = async (attempt = 0) => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error(error);
        if (attempt < 3) setTimeout(() => loadCategories(attempt + 1), 1500);
        return;
      }
      const rows = data || [];
      if (rows.length === 0 && attempt < 3) {
        setTimeout(() => loadCategories(attempt + 1), 1500);
        return;
      }
      setCategories((prev) => {
        if (rows.length === 0 && prev.length > 0) return prev;
        return rows;
      });
    };
    loadCategories();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCategories();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let removeResumeListener: (() => void) | null = null;
    (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("resume", () => loadCategories());
        removeResumeListener = () => handle.remove();
      } catch {}
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      removeResumeListener?.();
    };
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