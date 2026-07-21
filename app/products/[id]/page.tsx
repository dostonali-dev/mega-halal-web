"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, cart, setQty } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const productId = Number(params.id);
  const product = products.find((p) => p.id === productId);

  const currentInCart = cart[productId] || 0;
  const [localQty, setLocalQty] = useState(currentInCart > 0 ? currentInCart : 1);

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-400">Mahsulot topilmadi</p>
      </main>
    );
  }

  const outOfStock = product.in_stock === false;

  const handleConfirm = () => {
    setQty(product.id, localQty);
    router.push("/cart");
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
              Sotuvda yo'q
            </span>
          )}
          <h1 className="text-2xl font-bold text-black">{product.name}</h1>
          <p className="text-green-700 font-extrabold text-xl mt-2">{product.price.toLocaleString()}₩</p>

          {product.description && (
            <div className="mt-4">
              <h2 className="font-bold text-black mb-1">Tavsif</h2>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          {currentInCart > 0 && (
            <p className="mt-4 text-sm text-green-700 font-semibold">
              Hozir savatda: {currentInCart} ta
            </p>
          )}

          <div className="mt-4">
            {outOfStock ? (
              <div className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-lg text-center">
                Hozircha sotuvda yo'q
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-black mb-2">Miqdorni tanlang</p>
                <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3 mb-4">
                  <button
                    onClick={() => setLocalQty((q) => Math.max(1, q - 1))}
                    className="bg-white border-2 border-green-600 text-green-700 text-2xl font-bold w-10 h-10 rounded-xl"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={localQty}
                    onChange={(e) => setLocalQty(Math.max(1, Number(e.target.value) || 1))}
                    className="flex-1 text-center border-2 border-green-600 rounded-xl text-black font-bold py-2 bg-white text-lg"
                  />
                  <button
                    onClick={() => setLocalQty((q) => q + 1)}
                    className="bg-white border-2 border-green-600 text-green-700 text-2xl font-bold w-10 h-10 rounded-xl"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg"
                >
                  {currentInCart > 0 ? "Savatni yangilash" : "Savatchaga qo'shish"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}