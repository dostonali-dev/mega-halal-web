"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const { products, cart, addToCart, removeFromCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState("");

  const categories = [...new Set(products.map((p) => p.category))];
  const searchResults = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold text-green-800 text-center">
          Mega Halal Supermarket
        </h1>
        <p className="text-center text-gray-600 mt-4 text-lg">
          Koreya bo'ylab Halal mahsulotlar yetkazib berish
        </p>

        <div className="mt-8 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="🔎 Mahsulot qidirish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded-2xl p-4 text-black text-lg shadow"
          />
        </div>

        {query.trim() ? (
          <div className="mt-8 space-y-3">
            {searchResults.length === 0 && (
              <p className="text-center text-gray-400">Hech narsa topilmadi</p>
            )}
            {searchResults.map((item) => (
              <div key={item.id} className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center">
                <Link href={`/products/${item.id}`} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border bg-gray-100 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-black">{item.name}</p>
                    <p className="text-green-700 font-bold">{item.price.toLocaleString()}₩</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFavorite(item.id)} className="text-xl">
                    {favoriteIds.has(item.id) ? "❤️" : "🤍"}
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white w-9 h-9 rounded-lg">-</button>
                  <span className="text-lg font-bold text-black min-w-[22px] text-center">{cart[item.id] || 0}</span>
                  <button onClick={() => addToCart(item.id)} className="bg-green-600 text-white w-9 h-9 rounded-lg">+</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/categories/${encodeURIComponent(cat)}`}
                className="bg-white border border-green-100 rounded-3xl shadow-lg p-5 flex justify-between items-center"
              >
                <span className="text-xl font-bold text-black">{cat}</span>
                <span className="text-2xl text-green-700">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}