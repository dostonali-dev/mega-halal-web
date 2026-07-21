"use client";
import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import BottomNav from "@/components/BottomNav";

export default function CategoriesPage() {
  const { products, cart, addToCart, removeFromCart } = useCart();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">Kategoriyalar</h1>
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="bg-white border border-green-100 rounded-3xl shadow-lg overflow-hidden">
              <button onClick={() => setOpenCategory(openCategory === cat ? null : cat)} className="w-full p-5 flex justify-between items-center">
                <span className="text-xl font-bold text-black">{cat}</span>
                <span className="text-2xl text-green-700">{openCategory === cat ? "−" : "+"}</span>
              </button>
              {openCategory === cat && (
                <div className="px-5 pb-5">
                  {products.filter((p) => p.category === cat).map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-t py-4">
                      <div>
                        <p className="font-semibold text-black">{item.name}</p>
                        <p className="text-green-700 font-bold">{item.price.toLocaleString()}₩</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white w-10 h-10 rounded-lg">-</button>
                        <span className="text-lg font-bold text-black min-w-[25px] text-center">{cart[item.id] || 0}</span>
                        <button onClick={() => addToCart(item.id)} className="bg-green-600 text-white w-10 h-10 rounded-lg">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}