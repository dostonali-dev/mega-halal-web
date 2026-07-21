"use client";

import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import BottomNav from "@/components/BottomNav";

export default function FavoritesPage() {
  const { products, cart, addToCart, removeFromCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const items = products.filter((p) => favoriteIds.has(p.id));

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">❤️ Sevimlilar</h1>

        {items.length === 0 && (
          <p className="text-center text-gray-400 mt-10">Hali sevimli mahsulot yo'q</p>
        )}

        <div className="space-y-3">
          {items.map((item) => (
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
                <button onClick={() => toggleFavorite(item.id)} className="text-xl">❤️</button>
                <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white w-9 h-9 rounded-lg">-</button>
                <span className="text-lg font-bold text-black min-w-[22px] text-center">{cart[item.id] || 0}</span>
                <button onClick={() => addToCart(item.id)} className="bg-green-600 text-white w-9 h-9 rounded-lg">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}