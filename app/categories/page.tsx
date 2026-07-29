"use client";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";

// Sayt butunlay qora mavzuga o'tkazilgani uchun (globals.css) oddiy
// bg-green-50/bg-white kabi klasslar barchasi tekis qora rangga aylanib
// ketadi. Shu sababli bu yerda rang inline style orqali beriladi -
// shunda !important qoidalarni chetlab, chindan rangli chiqadi.
const TILE_GRADIENTS = [
  "linear-gradient(135deg, #22c55e, #15803d)",
  "linear-gradient(135deg, #f97316, #c2410c)",
  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  "linear-gradient(135deg, #ec4899, #be185d)",
  "linear-gradient(135deg, #a855f7, #7e22ce)",
  "linear-gradient(135deg, #eab308, #a16207)",
  "linear-gradient(135deg, #14b8a6, #0f766e)",
  "linear-gradient(135deg, #ef4444, #b91c1c)",
];

export default function CategoriesPage() {
  const { categories, products } = useCart();
  const { t } = useLanguage();

  const countFor = (name: string) =>
    products.filter((p) => p.category === name && p.hidden !== true).length;

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("categories_title")}</h1>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, i) => {
            const gradient = TILE_GRADIENTS[i % TILE_GRADIENTS.length];
            const count = countFor(cat.name);
            return (
              <Link
                key={cat.id}
                href={`/categories/${encodeURIComponent(cat.name)}`}
                className="relative block rounded-3xl overflow-hidden shadow-lg aspect-[4/5] active:scale-[0.97] transition-transform"
                style={{ background: gradient }}
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-6xl">
                    {cat.icon || "📦"}
                  </div>
                )}

                {/* Nom o'qilishi uchun pastdan yuqoriga qorayib boruvchi qatlam */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 72%)",
                  }}
                />

                {/* Yuqori burchakda rangli belgi - kartochkaga jonlilik beradi */}
                <div
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-base backdrop-blur-sm"
                  style={{ background: "rgba(255,255,255,0.22)" }}
                >
                  {cat.icon || "🛒"}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  <p
                    className="font-extrabold text-base leading-tight line-clamp-2"
                    style={{ color: "#ffffff", textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
                  >
                    {cat.name}
                  </p>
                  {count > 0 && (
                    <p
                      className="text-xs font-bold mt-1"
                      style={{ color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                    >
                      {count} ta mahsulot
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
