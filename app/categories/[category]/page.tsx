"use client";

import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import BottomNav from "@/components/BottomNav";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, cart, addToCart, removeFromCart } = useCart();
  const { favoriteIds, toggleFavorite } = useFavorites();

  const categoryName = decodeURIComponent(params.category as string);
  const items = products.filter((p) => p.category === categoryName);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">← Orqaga</button>
        <h1 className="text-2xl font-bold text-black mb-6">{categoryName}</h1>

        {items.length === 0 && <p className="text-gray-400 text-center mt-10">Bu kategoriyada mahsulot yo'q</p>}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg border bg-gray-100 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-black">{item.name}</p>
                  <p className="text-green-700 font-bold">{item.price.toLocaleString()}₩</p>
                </div>
              </div>
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
      </div>
      <BottomNav />
    </main>
  );
}