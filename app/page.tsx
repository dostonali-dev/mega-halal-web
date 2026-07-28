"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import InstallPrompt from "@/components/InstallPrompt";
import ProductRow from "@/components/ProductRow";
import AnnouncementPopup from "@/components/AnnouncementPopup";
import { recordSearchQuery } from "@/lib/searchHistory";

const INSTAGRAM_URL = "https://instagram.com/megahalalsupermarket";
const TIKTOK_URL = "https://tiktok.com/@megahalalsupermarket";

type Banner = { id: number; image: string; link: string | null };

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

export default function Home() {
  const { products, categories, cart, addToCart, removeFromCart } = useCart();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const loadBanners = async () => {
      const { data } = await supabase.from("banners").select("*").order("sort_order");
      if (data) setBanners(data);
    };
    loadBanners();
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => recordSearchQuery(query), 600);
    return () => clearTimeout(timer);
  }, [query]);

  const searchResults = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const newArrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 8);
  const hotProducts = products.filter((p) => (p as any).is_hot === true);
  const meatProducts = products.filter((p) => p.category === "Go'sht mahsulotlari");
  const discounted = products.filter((p) => p.discount_price != null && p.discount_price < p.price);

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
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

        <AnnouncementPopup />
        <InstallPrompt />
        <BannerCarousel banners={banners} />

        <div className="max-w-xl mx-auto mb-8">
          <input
            id="mhs-search-input"
            type="text"
            placeholder={t("search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded-2xl p-4 text-lg shadow"
          />
        </div>

        {query.trim() ? (
          <div className="mt-8 space-y-3">
            {searchResults.length === 0 && <p className="text-center">{t("no_results")}</p>}
            {searchResults.map((item) => (
              <div key={item.id} className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center">
                <Link href={`/products/${item.id}`} className="flex items-center gap-3">
                  {item.image ? <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" /> : <div className="w-14 h-14 rounded-lg border bg-gray-100 flex-shrink-0" />}
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

              <div className="grid grid-cols-2 gap-3 mb-3">
                <Link
                  href="/uzbekistan"
                  className="flex items-center gap-3 bg-white border-2 rounded-2xl shadow-sm p-3"
                  style={{ borderColor: "#3b82f6" }}
                >
                  <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: "#e0f2fe" }}>
                    <img src="/images/categories/uzbekistan-tile.png" alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-sm font-bold leading-tight" style={{ color: "#3b82f6" }}>{t("uzbekistan_tile")}</span>
                </Link>
                <Link
                  href="/discounts"
                  className="flex items-center gap-3 bg-white border-2 rounded-2xl shadow-sm p-3"
                  style={{ borderColor: "#f97316" }}
                >
                  <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden" style={{ backgroundColor: "#ffedd5" }}>
                    <img src="/images/categories/discounts-tile.png" alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-sm font-bold leading-tight" style={{ color: "#f97316" }}>{t("discounts_tile")}</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${encodeURIComponent(cat.name)}`}
                    className="flex items-center gap-3 bg-white border border-green-100 rounded-2xl shadow-sm p-3"
                  >
                    <span className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        cat.icon || "📦"
                      )}
                    </span>
                    <span className="text-sm font-bold leading-tight line-clamp-2">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <ProductRow title={t("new_products")} products={newArrivals} />
            <ProductRow title="🔥 O'zbekiston HOT" products={hotProducts} />
            <ProductRow title="🥩 Go'sht mahsulotlari" products={meatProducts} seeAllHref={`/categories/${encodeURIComponent("Go'sht mahsulotlari")}`} />
            <ProductRow title="🔥 Qaynoq chegirmalar" products={discounted} />

            <div className="flex gap-3 mb-8">
              <Link href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-3 rounded-xl font-bold">
                📸 Instagram
              </Link>
              <Link href={TIKTOK_URL} target="_blank" rel="noreferrer" className="flex-1 bg-black text-white text-center py-3 rounded-xl font-bold border border-neutral-700">
                🎵 TikTok
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
