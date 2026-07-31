"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import InstallPrompt from "@/components/InstallPrompt";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import ProductImage from "@/components/ProductImage";
import { recordSearchQuery } from "@/lib/searchHistory";
import { useFavorites } from "@/lib/FavoritesContext";
import { fetchProductSalesCounts, buildBestSellingList } from "@/lib/salesStats";

type Banner = { id: number; image: string; link: string | null };

type StripProduct = {
  id: number;
  name: string;
  price: number;
  image?: string;
  in_stock?: boolean;
  discount_price?: number | null;
};

// Bosh sahifada "O'zbekiston HOT" va "Chegirma tovarlar" uchun - yon tomonga
// (gorizontal) surib ko'radigan mahsulot lentasi. Avval bu joyda faqat
// kichik havola-kartochka (kategoriya kabi) bor edi, lekin dastlab shu
// tarzda - haqiqiy mahsulotlar bilan gorizontal skroll qilib chiqqan edi,
// shu ko'rinishga qaytarildi.
function ProductStrip({
  title,
  items,
  seeAllHref,
  cart,
  addToCart,
  removeFromCart,
  t,
}: {
  title: string;
  items: StripProduct[];
  seeAllHref: string;
  cart: Record<number, number>;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  t: (key: any) => string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link
          href={seeAllHref}
          aria-label="Barchasini ko'rish"
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#16a34a" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {items.slice(0, 12).map((item) => {
          const qty = cart[item.id] || 0;
          const outOfStock = item.in_stock === false;
          const hasDiscount = item.discount_price != null && item.discount_price < item.price;
          const discountPct = hasDiscount
            ? Math.round((1 - (item.discount_price as number) / item.price) * 100)
            : 0;
          return (
            <div
              key={item.id}
              className={`flex-shrink-0 w-32 relative bg-white border border-green-100 rounded-xl overflow-hidden ${outOfStock ? "opacity-60" : ""}`}
            >
              {hasDiscount && (
                <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  -{discountPct}%
                </span>
              )}
              <Link href={`/products/${item.id}`}>
                <ProductImage image={item.image} alt={item.name} className="w-full aspect-square object-cover" />
              </Link>
              <div className="p-2">
                <Link href={`/products/${item.id}`}>
                  <p className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{item.name}</p>
                </Link>
                <div className="mb-1.5">
                  <p className="text-green-400 font-bold text-xs">
                    {(hasDiscount ? item.discount_price! : item.price).toLocaleString()}₩
                  </p>
                  <p className={`text-gray-400 text-[10px] line-through ${hasDiscount ? "" : "invisible"}`}>
                    {item.price.toLocaleString()}₩
                  </p>
                </div>

                {outOfStock ? (
                  <span className="text-[10px] text-red-400 font-bold">{t("out_of_stock_label")}</span>
                ) : qty === 0 ? (
                  <button
                    onClick={() => addToCart(item.id)}
                    aria-label="Savatchaga qo'shish"
                    className="w-full rounded-lg py-1.5 flex items-center justify-center"
                    style={{ backgroundColor: "#a7f3d0" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 6h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L4.6 4.6A1 1 0 0 0 3.6 3.8H2" />
                      <circle cx="9" cy="20.5" r="1.4" fill="#000000" stroke="none" />
                      <circle cx="18" cy="20.5" r="1.4" fill="#000000" stroke="none" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-green-600 rounded-lg px-1.5 py-1">
                    <button onClick={() => removeFromCart(item.id)} className="text-white font-bold w-5 h-5 flex items-center justify-center text-xs">
                      {qty === 1 ? "🗑" : "−"}
                    </button>
                    <span className="text-white font-bold text-xs">{qty}</span>
                    <button onClick={() => addToCart(item.id)} className="text-white font-bold w-5 h-5 flex items-center justify-center text-xs">
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const goTo = (i: number) => {
    const len = banners.length;
    setIndex(((i % len) + len) % len);
  };

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    if (delta > 40) goTo(index - 1);
    else if (delta < -40) goTo(index + 1);
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const current = banners[index];
  const content = (
    <img
      src={current.image}
      alt="banner"
      draggable={false}
      className="w-full h-40 md:h-56 object-cover rounded-2xl select-none"
    />
  );

  return (
    <div
      className="relative mb-8 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {current.link ? <Link href={current.link}>{content}</Link> : content}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => goTo(i)}
              aria-label={`banner ${i + 1}`}
              className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M12 8v4.5l3 2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.5 4c2-.3 3.9.7 5 2.3C11.6 4.7 13.5 3.7 15.5 4 19 4.5 20.5 8 20.5 11.2 18 15.9 12 20.5 12 20.5Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

const CATEGORIES_COLLAPSED_COUNT = 8;

export default function Home() {
  const { products, categories, cart, addToCart, removeFromCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [salesCounts, setSalesCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase.from("banners").select("*").order("sort_order");
      if (data) setBanners(data);
    };
    loadBanners();
  }, []);

  useEffect(() => {
    fetchProductSalesCounts().then(setSalesCounts);
  }, []);

  // Panel instrumentov'dagi "Bosh sahifa" tugmasi allaqachon shu sahifada
  // bosilganda, sahifani boshiga (yuqoriga) qaytarish uchun.
  useEffect(() => {
    const handleHomeTap = () => window.scrollTo({ top: 0, behavior: "smooth" });
    window.addEventListener("mhs-home-tab-tap", handleHomeTap);
    return () => window.removeEventListener("mhs-home-tab-tap", handleHomeTap);
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => recordSearchQuery(query), 600);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const searchResults = query.trim()
    ? products.filter((p) => {
        const q = query.trim().toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          ((p as any).keywords || "").toLowerCase().includes(q)
        );
      })
    : [];

  const hotItems = products.filter((p) => (p as any).is_hot === true);
  const discountItems = products.filter(
    (p) => p.discount_price != null && p.discount_price < p.price
  );
  const bestSellingItems = buildBestSellingList(products, categories, salesCounts);
  const newestItems = [...products].sort((a, b) => b.id - a.id).slice(0, 12);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, CATEGORIES_COLLAPSED_COUNT);

  return (
    <main className="min-h-screen pb-24">
      <div className="max-w-5xl mx-auto p-4 md:p-8 pb-0">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="site-title text-2xl md:text-3xl font-extrabold">
            Mega Halal Supermarket
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/recently-viewed"
              aria-label={t("recently_viewed_title")}
              className="w-10 h-10 rounded-full border border-green-100 bg-white flex items-center justify-center text-green-600"
            >
              <RecentIcon />
            </Link>
            <Link
              href="/favorites"
              aria-label={t("favorites_title")}
              className="w-10 h-10 rounded-full border border-green-100 bg-white flex items-center justify-center text-green-600"
            >
              <HeartIcon />
            </Link>
          </div>
        </div>
        <p className="text-center mt-2 text-lg mb-6">
          {t("home_subtitle")}
        </p>
      </div>

      {/* Qidiruv katagi banner tepasida, pastga tushgan sari tepada "pin" bo'lib
          qoladi, shaffof. Faqat dumaloq katakchaning o'zi — atrofida
          to'rtburchak ramka/fon yo'q. */}
      <div
        className="sticky z-40 px-4 md:px-8 mb-6"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 44px)",
          scrollMarginTop: "calc(env(safe-area-inset-top, 0px) + 44px)",
        }}
      >
        <div className="max-w-xl mx-auto relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            <SearchIcon />
          </span>
          <input
            id="mhs-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-transparent-input w-full rounded-full py-3 pl-11 pr-4 text-base border backdrop-blur-sm focus:outline-none"
            style={{ scrollMarginTop: "calc(env(safe-area-inset-top, 0px) + 44px)" }}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 pt-0">
        <div className="mb-6">
          <AnnouncementPopup />
          <InstallPrompt />
          <BannerCarousel banners={banners} />
        </div>
        {query.trim() ? (
          <div className="mt-8 space-y-3">
            {searchResults.length === 0 && <p className="text-center">{t("no_results")}</p>}
            {searchResults.map((item) => (
              <div key={item.id} className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center">
                <Link href={`/products/${item.id}`} className="flex items-center gap-3">
                  <ProductImage image={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" compact />
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-green-400 font-bold">{item.price.toLocaleString()}₩</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white w-9 h-9 rounded-lg">-</button>
                  <span className="font-bold min-w-[22px] text-center">{cart[item.id] || 0}</span>
                  <button onClick={() => addToCart(item.id)} className="bg-green-600 text-white w-9 h-9 rounded-lg">+</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-2 mb-8">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span>🗂️</span>
                {t("categories_title")}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {visibleCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-3 rounded-2xl shadow-sm p-2.5"
                    style={{ backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}
                  >
                    <span className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        cat.icon || "📦"
                      )}
                    </span>
                    <span className="text-sm font-extrabold leading-tight line-clamp-2" style={{ color: "#000000" }}>{cat.name}</span>
                  </Link>
                ))}
              </div>

              {categories.length > CATEGORIES_COLLAPSED_COUNT && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: "#1a1a1a", color: "#4ade80" }}
                >
                  {showAllCategories ? "Kamroq ko'rsatish" : "Barchasi"}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: showAllCategories ? "rotate(180deg)" : "none" }}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
            </div>

            <ProductStrip
              title={t("discounts_page_title")}
              items={discountItems}
              seeAllHref="/discounts"
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              t={t}
            />

            <ProductStrip
              title={t("uzbekistan_page_title")}
              items={hotItems}
              seeAllHref="/uzbekistan"
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              t={t}
            />

            <div className="mt-2 mb-8">
              <h2 className="text-xl font-bold mb-3">{t("best_selling_title")}</h2>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {bestSellingItems.map((item) => {
                  const qty = cart[item.id] || 0;
                  const outOfStock = item.in_stock === false;
                  const hasDiscount = item.discount_price != null && item.discount_price < item.price;
                  const discountPct = hasDiscount
                    ? Math.round((1 - (item.discount_price as number) / item.price) * 100)
                    : 0;
                  return (
                    <div key={item.id} className={`relative bg-white border border-green-100 rounded-xl overflow-hidden ${outOfStock ? "opacity-60" : ""}`}>
                      {hasDiscount && (
                        <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          -{discountPct}%
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        aria-label={t("favorites_title")}
                        className="absolute top-1.5 right-1.5 z-10 bg-white/90 rounded-full w-7 h-7 flex items-center justify-center text-xs shadow"
                      >
                        {favoriteIds.has(item.id) ? "❤️" : "🤍"}
                      </button>
                      <Link href={`/products/${item.id}`}>
                        <ProductImage image={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                      </Link>
                      <div className="p-2">
                        <Link href={`/products/${item.id}`}>
                          <p className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{item.name}</p>
                        </Link>
                        <div className="mb-1.5">
                          <p className="text-green-400 font-bold text-xs">
                            {(hasDiscount ? item.discount_price! : item.price).toLocaleString()}₩
                          </p>
                          <p className={`text-gray-400 text-[10px] line-through ${hasDiscount ? "" : "invisible"}`}>
                            {item.price.toLocaleString()}₩
                          </p>
                        </div>

                        {outOfStock ? (
                          <span className="text-[10px] text-red-400 font-bold">{t("out_of_stock_label")}</span>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => addToCart(item.id)}
                            aria-label="Savatchaga qo'shish"
                            className="w-full bg-green-600 text-white rounded-lg py-1 text-xs font-bold flex items-center justify-center"
                          >
                            🛒
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-green-600 rounded-lg px-1.5 py-1">
                            <button onClick={() => removeFromCart(item.id)} className="text-white font-bold w-5 h-5 flex items-center justify-center text-xs">
                              {qty === 1 ? "🗑" : "−"}
                            </button>
                            <span className="text-white font-bold text-xs">{qty}</span>
                            <button onClick={() => addToCart(item.id)} className="text-white font-bold w-5 h-5 flex items-center justify-center text-xs">
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <ProductStrip
              title={t("new_products")}
              items={newestItems}
              seeAllHref="/new-products"
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              t={t}
            />
          </>
        )}
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Yuqoriga"
          className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg"
        >
          <ArrowUpIcon />
        </button>
      )}
    </main>
  );
}
