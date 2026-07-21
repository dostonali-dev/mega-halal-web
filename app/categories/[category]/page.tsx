"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useFavorites } from "@/lib/FavoritesContext";
import BottomNav from "@/components/BottomNav";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { products, cart, addToCart, removeFromCart, setQty } = useCart();
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
          {items.map((item) => {
            const outOfStock = item.in_stock === false;
            return (
              <div key={item.id} className={`bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center ${outOfStock ? "opacity-60" : ""}`}>
                <Link href={`/products/${item.id}`} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border bg-gray-100 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-black">{item.name}</p>
                    <p className="text-green-700 font-bold">{item.price.toLocaleString()}₩</p>
                    {outOfStock && <p className="text-red-500 text-xs font-bold">Sotuvda yo'q</p>}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFavorite(item.id)} className="text-xl">
                    {favoriteIds.has(item.id) ? "❤️" : "🤍"}
                  </button>
                  {outOfStock ? (
                    <span className="text-xs text-gray-400 font-bold px-2">—</span>
                  ) : (
                    <>
                      <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white w-9 h-9 rounded-lg">-</button>
                      <input
                        type="number"
                        min={0}
                        value={cart[item.id] || 0}
                        onChange={(e) => setQty(item.id, Math.max(0, Number(e.target.value) || 0))}
                        className="w-14 text-center border rounded-lg text-black font-bold py-1"
                      />
                      <button onClick={() => addToCart(item.id)} className="bg-green-600 text-white w-9 h-9 rounded-lg">+</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}