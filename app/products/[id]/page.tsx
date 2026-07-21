"use client";

import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, cart, addToCart, removeFromCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const productId = Number(params.id);
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-400">Mahsulot topilmadi</p>
      </main>
    );
  }

  const qty = cart[product.id] || 0;

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
            <img src={product.image} alt={product.name} className="w-full h-80 object-cover" />
          ) : (
            <div className="w-full h-80 bg-gray-100" />
          )}
        </div>

        <div className="p-5">
          <h1 className="text-2xl font-bold text-black">{product.name}</h1>
          <p className="text-green-700 font-extrabold text-xl mt-2">{product.price.toLocaleString()}₩</p>

          {product.description && (
            <div className="mt-4">
              <h2 className="font-bold text-black mb-1">Tavsif</h2>
              <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}

          <div className="mt-8">
            {qty > 0 ? (
              <div className="flex items-center gap-4 bg-green-600 rounded-2xl px-4 py-3 justify-between">
                <button onClick={() => removeFromCart(product.id)} className="text-white text-2xl font-bold w-8 h-8">−</button>
                <span className="text-white text-xl font-bold">{qty}</span>
                <button onClick={() => addToCart(product.id)} className="text-white text-2xl font-bold w-8 h-8">+</button>
              </div>
            ) : (
              <button
                onClick={() => addToCart(product.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg"
              >
                Savatchaga qo'shish
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}