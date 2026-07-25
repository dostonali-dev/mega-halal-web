"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import { useLanguage } from "@/lib/LanguageContext";
import { useRecentlyViewed } from "@/lib/RecentlyViewedContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, cart, setQty, getMaxQty } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const { recordView } = useRecentlyViewed();

  const productId = Number(params.id);
  const product = products.find((p) => p.id === productId);

  const currentInCart = cart[productId] || 0;
  const [localQty, setLocalQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (product) recordView(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-400">{t("product_not_found")}</p>
      </main>
    );
  }

  const maxQty = getMaxQty(product.id);
  const remaining = Math.max(0, maxQty - currentInCart);
  const outOfStock = product.in_stock === false || maxQty <= 0;

  const clampLocalQty = (val: number) => {
    const min1 = Math.max(1, val);
    return remaining > 0 ? Math.min(min1, remaining) : min1;
  };

  const handleConfirm = () => {
    setQty(product.id, currentInCart + localQty);
    setJustAdded(true);
    setLocalQty(1);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-10 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow text-black"
          >
            ←
          </button>
          <button
            onClick={() => toggleFavorite(product.id)}
            className="absolute top-4 right-4 z-10 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center shadow text-xl"
          >
            {favoriteIds.has(product.id) ? "❤️" : "🤍"}
          </button>
          {product.image ? (
            <img src={product.image} alt={product.name} className={`w-full h-80 object-cover ${outOfStock ? "opacity-50 grayscale" : ""}`} />
          ) : (
            <div className="w-full h-80 bg-gray-100" />
          )}
        </div>

        <div className="p-5">
          {outOfStock && (
            <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full mb-2">
              {t("out_of_stock_label")}
            </span>
          )}
          <h1 className="text-2xl font-bold text-black">{product.name}</h1>
          <p className="text-green-700 font-extrabold text-xl mt-2">{product.price.toLocaleString()}₩</p>

          {product.description && (
            <div className="mt-4">
              <h2 className="font-bold text-black mb-1">{t("product_description")}</h2>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {currentInCart > 0 && (
            <p className="mt-4 text-sm text-green-700 font-semibold">
              {t("product_in_cart")} {currentInCart}
            </p>
          )}

          {!outOfStock && maxQty !== Infinity && (
            <p className="mt-1 text-xs text-gray-500">
              {t("product_stock_available")} {maxQty} {remaining === 0 && t("product_stock_all_in_cart")}
            </p>
          )}

          <div className="mt-4">
            {outOfStock ? (
              <div className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-lg text-center">
                {t("product_out_of_stock")}
              </div>
            ) : remaining <= 0 ? (
              <div className="w-full bg-yellow-100 text-yellow-700 py-4 rounded-2xl font-bold text-center">
                {t("product_max_in_cart")}
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-black mb-2">{t("product_choose_qty")}</p>
                <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3 mb-4">
                  <button
                    onClick={() => setLocalQty((q) => clampLocalQty(q - 1))}
                    className="bg-white border-2 border-green-600 text-green-700 text-2xl font-bold w-10 h-10 rounded-xl"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={remaining}
                    value={localQty}
                    onChange={(e) => setLocalQty(clampLocalQty(Number(e.target.value) || 1))}
                    className="flex-1 text-center border-2 border-green-600 rounded-xl text-black font-bold py-2 bg-white text-lg"
                  />
                  <button
                    onClick={() => setLocalQty((q) => clampLocalQty(q + 1))}
                    disabled={localQty >= remaining}
                    className="bg-white border-2 border-green-600 text-green-700 text-2xl font-bold w-10 h-10 rounded-xl disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleConfirm}
                  className={`w-full py-4 rounded-2xl font-bold text-lg text-white ${justAdded ? "bg-green-800" : "bg-green-600 hover:bg-green-700"}`}
                >
                  {justAdded ? t("product_added") : t("product_add_to_cart")}
                </button>
              </>
            )}

            {currentInCart > 0 && (
              <button
                onClick={() => router.push("/cart")}
                className="w-full mt-3 py-4 rounded-2xl font-bold text-lg text-green-700 bg-white border-2 border-green-600 flex items-center justify-center gap-2"
              >
                🛒 {t("product_go_to_cart")} ({currentInCart})
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}