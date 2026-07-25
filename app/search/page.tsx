"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";
import ProductRow from "@/components/ProductRow";
import { recordSearchQuery, getTopSearchQueries } from "@/lib/searchHistory";

export default function SearchPage() {
  const { products, cart, addToCart, removeFromCart } = useCart();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [topQueries, setTopQueries] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setTopQueries(getTopSearchQueries());
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;
    debounceRef.current = setTimeout(() => {
      recordSearchQuery(query);
      setTopQueries(getTopSearchQueries());
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const searchResults = query.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const mostSearchedProducts = useMemo(() => {
    const seen = new Set<number>();
    const result: typeof products = [];
    for (const q of topQueries) {
      const match = products.find((p) => !seen.has(p.id) && p.name.toLowerCase().includes(q));
      if (match) {
        seen.add(match.id);
        result.push(match);
      }
    }
    return result;
  }, [topQueries, products]);

  const recommended = useMemo(() => {
    return [...products]
      .filter((p) => p.in_stock !== false)
      .sort((a, b) => {
        const aHot = (a as any).is_hot ? 1 : 0;
        const bHot = (b as any).is_hot ? 1 : 0;
        return bHot - aHot || b.id - a.id;
      })
      .slice(0, 8);
  }, [products]);

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t("search_page_title")}</h1>

        <div className="max-w-xl mx-auto mb-8">
          <input
            ref={inputRef}
            type="text"
            placeholder={t("search_placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded-2xl p-4 text-lg shadow"
          />
        </div>

        {query.trim() ? (
          <div className="space-y-3">
            {searchResults.length === 0 && <p className="text-center">{t("no_results")}</p>}
            {searchResults.map((item) => (
              <div key={item.id} className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center">
                <Link href={`/products/${item.id}`} className="flex items-center gap-3">
                  {item.image ? <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" /> : <div className="w-14 h-14 rounded-lg border bg-gray-100 flex-shrink-0" />}
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-green-400 font-bold">{item.price.toLocaleString()}₩</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button onClick={() => removeFromCart(item.id)} className="bg-red-500 text-white w-9 h-9 rounded-lg">-</button>
                  <span className="font-bold min-w-[22px] text-center">{cart[item.id] || 0}</span>
                  <button onClick={() => addToCart(item.id)} className="bg-green-600 text-white w-9 h-9 rounded-lg">+</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {mostSearchedProducts.length > 0 && (
              <ProductRow title={t("search_most_searched_title")} products={mostSearchedProducts} />
            )}
            <ProductRow title={t("search_recommended_title")} products={recommended} />
          </>
        )}
      </div>
    </main>
  );
}
