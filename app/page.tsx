"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import ProductRow from "@/components/ProductRow";

const INSTAGRAM_URL = "https://instagram.com/megahalalsupermarket";
const TIKTOK_URL = "https://tiktok.com/@megahalalsupermarket";

type Banner = { id: number; image: string; link: string | null };

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const current = banners[index];
  const content = (
    <img src={current.image} alt="banner" className="w-full h-40 md:h-56 object-cover rounded-2xl" />
  );

  return (
    <div className="relative mb-8">
      {current.link ? <Link href={current.link}>{content}</Link> : content}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((b, i) => (
            <span key={b.id} className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
          ))}
        </div>
      )}
    </div>
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
        <h1 className="site-title text-4xl md:text-6xl font-extrabold text-center">
          Mega Halal Supermarket
        </h1>
        <p className="text-center mt-4 text-lg mb-6">
          {t("home_subtitle")}
        </p>

        <InstallPrompt />
        <BannerCarousel banners={banners} />

        {!query.trim() && (
          <>
            <ProductRow title={t("new_products")} products={newArrivals} />
            <ProductRow title="🔥 O'zbekiston HOT" products={hotProducts} />
            <ProductRow title="🥩 Go'sht mahsulotlari" products={meatProducts} seeAllHref={`/categories/${encodeURIComponent("Go'sht mahsulotlari")}`} />
            <ProductRow title="🔥 Qaynoq chegirmalar" products={discounted} />
          </>
        )}

        <div className="flex gap-3 mb-8">
          <Link href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-3 rounded-xl font-bold">
            📸 Instagram
          </Link>
          <Link href={TIKTOK_URL} target="_blank" rel="noreferrer" className="flex-1 bg-black text-white text-center py-3 rounded-xl font-bold border border-neutral-700">
            🎵 TikTok
          </Link>
        </div>

        <div className="max-w-xl mx-auto">
          <input
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
          <div className="mt-4">
            {categories.map((cat) => {
              const items = products.filter((p) => p.category === cat.name).slice(0, 6);
              return (
                <ProductRow
                  key={cat.id}
                  title={`${cat.icon || "📦"} ${cat.name}`}
                  products={items}
                  seeAllHref={`/categories/${encodeURIComponent(cat.name)}`}
                />
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}