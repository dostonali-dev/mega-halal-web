"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function DiscountsPage() {
  const router = useRouter();
  const { products } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();

  const items = products.filter((p) => p.discount_price != null && p.discount_price < p.price);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">{t("back")}</button>
        <h1 className="text-2xl font-bold text-black mb-6">{t("discounts_page_title")}</h1>

        {items.length === 0 && <p className="text-gray-400 text-center mt-10">{t("category_empty")}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const outOfStock = item.in_stock === false;
            return (
              <div key={item.id} className={`relative bg-white border border-green-100 rounded-2xl overflow-hidden ${outOfStock ? "opacity-60" : ""}`}>
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="absolute top-2 right-2 z-10 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow"
                >
                  {favoriteIds.has(item.id) ? "❤️" : "🤍"}
                </button>
                <Link href={`/products/${item.id}`}>
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-32 object-cover" /> : <div className="w-full h-32 bg-gray-100" />}
                  <div className="p-3">
                    <p className="font-semibold text-black text-sm line-clamp-2">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-green-700 font-bold">{item.discount_price!.toLocaleString()}₩</p>
                      <p className="text-gray-400 text-xs line-through">{item.price.toLocaleString()}₩</p>
                    </div>
                    {outOfStock && <p className="text-red-500 text-xs font-bold mt-1">{t("out_of_stock_label")}</p>}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
