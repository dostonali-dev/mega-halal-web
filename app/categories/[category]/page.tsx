"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

export default function CategoryDetailPage() {
  const params = useParams();
  const { products, categories, cart, addToCart, removeFromCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();

  const categoryName = decodeURIComponent(params.category as string);
  const category = categories.find((c) => c.name === categoryName);
  const items = products
    .filter((p) => p.category === categoryName)
    .sort((a, b) => a.name.localeCompare(b.name, "uz"));

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-24">
      <PageHeader title={categoryName} />

      {/* Kategoriya "hero" bannerini - nom + icon, to'q yashil fonda */}
      <div className="max-w-5xl mx-auto px-4 pt-3">
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ backgroundColor: "#0f2e1e" }}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#86efac" }}>
              {t("category_label")}
            </p>
            <p className="text-2xl font-extrabold text-white mt-0.5 truncate">{categoryName}</p>
          </div>
          <span
            className="ml-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl overflow-hidden flex-shrink-0"
            style={{ backgroundColor: "#ffffff" }}
          >
            {category?.image_url ? (
              <img src={category.image_url} alt={categoryName} className="w-full h-full object-cover" />
            ) : (
              category?.icon || "📦"
            )}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {items.length === 0 && <p className="text-gray-400 text-center mt-10">{t("category_empty")}</p>}

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {items.map((item) => {
            const qty = cart[item.id] || 0;
            const outOfStock = item.in_stock === false;
            const hasDiscount = item.discount_price != null && item.discount_price < item.price;
            const discountPct = hasDiscount
              ? Math.round((1 - (item.discount_price as number) / item.price) * 100)
              : 0;
            return (
              <div
                key={item.id}
                className={`relative bg-white border border-green-100 rounded-xl overflow-hidden ${outOfStock ? "opacity-60" : ""}`}
              >
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
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100" />
                  )}
                </Link>
                <div className="p-2">
                  <Link href={`/products/${item.id}`}>
                    <p className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{item.name}</p>
                  </Link>
                  {hasDiscount ? (
                    <div className="mb-1.5">
                      <p className="text-green-400 font-bold text-xs">{item.discount_price!.toLocaleString()}₩</p>
                      <p className="text-gray-400 text-[10px] line-through">{item.price.toLocaleString()}₩</p>
                    </div>
                  ) : (
                    <p className="text-green-400 font-bold text-xs mb-1.5">{item.price.toLocaleString()}₩</p>
                  )}

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
    </main>
  );
}
