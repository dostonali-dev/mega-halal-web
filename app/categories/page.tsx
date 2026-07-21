"use client";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import BottomNav from "@/components/BottomNav";

export default function CategoriesPage() {
  const { products } = useCart();
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">Kategoriyalar</h1>
        <div className="space-y-4">
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
      </div>
      <BottomNav />
    </main>
  );
}