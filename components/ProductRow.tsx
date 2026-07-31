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
            <div key={p.id} className="flex-shrink-0 w-36 bg-white border border-green-100 rounded-2xl overflow-hidden relative">
              {hasDiscount && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                  -{percent}%
                </span>
              )}
              <Link href={`/products/${p.id}`}>
                <ProductImage image={p.image} alt={p.name} className={`w-full h-28 object-cover ${outOfStock ? "opacity-50 grayscale" : ""}`} />
              </Link>
              <div className="p-2">
                <p className={`text-gray-400 text-xs line-through ${hasDiscount ? "" : "invisible"}`}>
                  {p.price.toLocaleString()}₩
                </p>
                <p className={hasDiscount ? "text-red-500 font-bold text-sm" : "text-green-400 font-bold text-sm"}>
                  {(hasDiscount ? p.discount_price! : p.price).toLocaleString()}₩
                </p>
                <p className="text-xs font-semibold line-clamp-2 mb-2">{p.name}</p>

                {outOfStock ? (
                  <span className="text-[10px] text-red-400 font-bold">Sotuvda yo'q</span>
                ) : qty === 0 ? (
                  <button
                    onClick={() => addToCart(p.id)}
                    aria-label="Savatchaga qo'shish"
                    className="w-full rounded-lg py-2 flex items-center justify-center"
                    style={{ backgroundColor: "#a7f3d0" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 6h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L4.6 4.6A1 1 0 0 0 3.6 3.8H2" />
                      <circle cx="9" cy="20.5" r="1.4" fill="#000000" stroke="none" />
                      <circle cx="18" cy="20.5" r="1.4" fill="#000000" stroke="none" />
                    </svg>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-green-600 rounded-lg px-2 py-1">
                    <button onClick={() => removeFromCart(p.id)} className="text-white font-bold w-6 h-6 flex items-center justify-center">
                      {qty === 1 ? "🗑" : "−"}
                    </button>
                    <span className="text-white font-bold text-sm">{qty}</span>
                    <button onClick={() => addToCart(p.id)} className="text-white font-bold w-6 h-6 flex items-center justify-center">
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
}