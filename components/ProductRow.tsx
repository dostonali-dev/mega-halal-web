"use client";

import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import ProductImage from "@/components/ProductImage";

type Product = {
  id: number;
  name: string;
  price: number;
  image?: string;
  discount_price?: number | null;
  in_stock?: boolean;
  gram?: number | null;
  weight_unit?: string | null;
  manufacturer?: string | null;
};

export default function ProductRow({
  title,
  products,
  seeAllHref,
}: {
  title: string;
  products: Product[];
  seeAllHref?: string;
}) {
  const { cart, addToCart, removeFromCart } = useCart();

  if (products.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-green-400 font-bold text-sm">
            barchasi →
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {products.map((p) => {
          const qty = cart[p.id] || 0;
          const outOfStock = p.in_stock === false;
          const hasDiscount = p.discount_price != null && p.discount_price < p.price;
          const percent = hasDiscount ? Math.round((1 - p.discount_price! / p.price) * 100) : 0;

          return (
            <div key={p.id} className="flex-shrink-0 w-36 bg-white border border-green-100 rounded-2xl overflow-hidden relative flex flex-col">
              {hasDiscount && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                  -{percent}%
                </span>
              )}
              <Link href={`/products/${p.id}`}>
                <ProductImage image={p.image} alt={p.name} className={`w-full h-28 object-cover ${outOfStock ? "opacity-50 grayscale" : ""}`} />
              </Link>
              <div className="p-2 flex flex-col flex-1">
                <p className="font-bold text-base leading-tight line-clamp-2 mb-1 min-h-[2.4em]">{p.name}</p>
                {(p.gram != null || p.manufacturer) && (
                  <p className="text-gray-400 text-xs mb-1 truncate">
                    {p.manufacturer || ""}
                    {p.gram != null && p.manufacturer ? " · " : ""}
                    {p.gram != null ? `${p.gram.toLocaleString()} ${p.weight_unit || "gr"}` : ""}
                  </p>
                )}
                <div className="flex items-baseline gap-1.5 mb-2 flex-wrap">
                  <p className={hasDiscount ? "text-red-500 font-extrabold text-lg" : "text-green-400 font-extrabold text-lg"}>
                    {(hasDiscount ? p.discount_price! : p.price).toLocaleString()}₩
                  </p>
                  {hasDiscount && (
                    <p className="text-gray-400 text-xs line-through">
                      {p.price.toLocaleString()}₩
                    </p>
                  )}
                </div>

                <div className="mt-auto">
                  {outOfStock ? (
                    <span className="text-[10px] text-red-400 font-bold">Sotuvda yo'q</span>
                  ) : qty === 0 ? (
                    <button
                      onClick={() => addToCart(p.id)}
                      aria-label="Savatchaga qo'shish"
                      className="w-full rounded-lg py-2.5 flex items-center justify-center"
                      style={{ backgroundColor: "#16a34a" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 6h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L4.6 4.6A1 1 0 0 0 3.6 3.8H2" />
                        <circle cx="9" cy="20.5" r="1.4" fill="#ffffff" stroke="none" />
                        <circle cx="18" cy="20.5" r="1.4" fill="#ffffff" stroke="none" />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-green-600 rounded-lg px-2 py-1.5">
                      <button onClick={() => removeFromCart(p.id)} aria-label={qty === 1 ? "O'chirish" : "Kamaytirish"} className="text-white font-bold w-6 h-6 flex items-center justify-center">
                        {qty === 1 ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16" />
                            <path d="M6 7l1 13a2 2 0 0 0 2 1.9h6a2 2 0 0 0 2-1.9L18 7" />
                            <path d="M9.5 7V4.8A1 1 0 0 1 10.5 3.8h3a1 1 0 0 1 1 1V7" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        ) : "−"}
                      </button>
                      <span className="text-white font-bold text-sm">{qty}</span>
                      <button onClick={() => addToCart(p.id)} className="text-white font-bold w-6 h-6 flex items-center justify-center">
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}