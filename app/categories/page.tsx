"use client";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function CategoriesPage() {
  const { categories } = useCart();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("categories_title")}</h1>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${encodeURIComponent(cat.name)}`}
              className="bg-white border border-green-100 rounded-2xl shadow p-5 flex flex-col items-center justify-center text-center gap-2 aspect-square"
            >
              <span className="text-3xl">{cat.icon || "📦"}</span>
              <span className="text-base font-bold">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}