"use client";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";

// "Bo'limlar" (kategoriyalar) sahifasi - endi har bir kategoriyadagi
// mahsulotlarni gorizontal qatorda ko'rsatish o'rniga, oddiy 2 ustunli
// katalog ko'rinishida (icon + nomi) chiqadi - bosilganda o'sha
// kategoriyaning to'liq sahifasiga o'tadi.
export default function CategoriesPage() {
  const { categories, products: allProducts } = useCart();
  // Faqat variant bo'lmagan mahsulotlar hisobga olinadi - aks holda faqat
  // variantlardan iborat kategoriya "bo'sh emas" deb noto'g'ri ko'rinishi mumkin.
  const products = allProducts.filter((p) => !p.parent_product_id);
  const { t } = useLanguage();

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>📂</span> {t("categories_title")}
        </h1>

        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const items = products.filter((p) => p.category === cat.name && p.hidden !== true);
            if (items.length === 0) return null;

            return (
              <Link
                key={cat.id}
                href={`/categories/${encodeURIComponent(cat.name)}`}
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{ backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}
              >
                <span
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    cat.icon || "📦"
                  )}
                </span>
                <p className="font-extrabold text-sm leading-tight min-w-0 flex-1" style={{ color: "#000000" }}>
                  {cat.name}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
