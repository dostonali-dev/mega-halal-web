"use client";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";

// "Bo'limlar" (kategoriyalar) sahifasi - endi katta rasmli plitkalar
// o'rniga, har bir kategoriya uchun: nomi+icon (och yashil fonda,
// bosilganda o'sha kategoriyaga to'liq kiradi) va ostida o'sha
// kategoriyadagi mahsulotlar gorizontal qatorda (rasm, nom, narx,
// savatcha) ketma-ket ko'rsatiladi.
export default function CategoriesPage() {
  const { categories, products, cart, addToCart, removeFromCart } = useCart();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t("categories_title")}</h1>

        {categories.map((cat) => {
          const items = products.filter((p) => p.category === cat.name && p.hidden !== true);
          if (items.length === 0) return null;

          return (
            <div key={cat.id} className="mb-6">
              <Link
                href={`/categories/${encodeURIComponent(cat.name)}`}
                className="rounded-2xl p-3 flex items-center gap-3 mb-3"
                style={{ backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}
              >
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: "#ffffff" }}
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    cat.icon || "📦"
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-base truncate" style={{ color: "#000000" }}>{cat.name}</p>
                </div>
                <span
                  aria-label="Barchasini ko'rish"
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#16a34a" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
                {items.slice(0, 12).map((item) => {
                  const qty = cart[item.id] || 0;
                  const outOfStock = item.in_stock === false;
                  const hasDiscount = item.discount_price != null && item.discount_price < item.price;
                  const discountPct = hasDiscount
                    ? Math.round((1 - (item.discount_price as number) / item.price) * 100)
                    : 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex-shrink-0 w-32 relative bg-white border border-green-100 rounded-xl overflow-hidden ${outOfStock ? "opacity-60" : ""}`}
                    >
                      {hasDiscount && (
                        <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          -{discountPct}%
                        </span>
                      )}
                      <Link href={`/products/${item.id}`}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100" />
                        )}
                      </Link>
                      <div className="p-2">
                        <Link href={`/products/${item.id}`}>
                          <p className="font-semibold text-xs leading-tight line-clamp-2 mb-1">{item.name}</p>
                        </Link>
                        <div className="mb-1.5">
                          <p className="text-green-400 font-bold text-xs">
                            {(hasDiscount ? item.discount_price! : item.price).toLocaleString()}₩
                          </p>
                          <p className={`text-gray-400 text-[10px] line-through ${hasDiscount ? "" : "invisible"}`}>
                            {item.price.toLocaleString()}₩
                          </p>
                        </div>

                        {outOfStock ? (
                          <span className="text-[10px] text-red-400 font-bold">{t("out_of_stock_label")}</span>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => addToCart(item.id)}
                            aria-label="Savatchaga qo'shish"
                            className="w-full rounded-lg py-1.5 flex items-center justify-center"
                            style={{ backgroundColor: "#a7f3d0" }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 6h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L4.6 4.6A1 1 0 0 0 3.6 3.8H2" />
                              <circle cx="9" cy="20.5" r="1.4" fill="#000000" stroke="none" />
                              <circle cx="18" cy="20.5" r="1.4" fill="#000000" stroke="none" />
                            </svg>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-green-600 rounded-lg px-1.5 py-1">
                            <button onClick={() => removeFromCart(item.id)} className="text-white font-bold w-5 h-5 flex items-center justify-center text-xs">
                              {qty === 1 ? "🗑" : "−"}
                            </button>
                            <span className="text-white font-bold text-xs">{qty}</span>
                            <button onClick={() => addToCart(item.id)} className="text-white font-bold w-5 h-5 flex items-center justify-center text-xs">
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
