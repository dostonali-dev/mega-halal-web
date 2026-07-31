"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import ProductRow from "@/components/ProductRow";
import { DELIVERY_FEE, FREE_SHIPPING_THRESHOLD, getDeliveryFee, getFreeShippingRemaining } from "@/lib/delivery";
import { fetchUserPurchaseHistory } from "@/lib/salesStats";

// Miqdor inputi - o'zining lokal "qoralama" holatiga ega, shuning uchun
// foydalanuchi maydonni tozalab (bo'sh qoldirib) yangi raqam yozayotganda
// savatchadagi mahsulot darhol o'chib ketmaydi (0 -> setQty o'chirib
// yuboradi -> qator darhol yo'qoladi va yozish imkonsiz bo'ladi edi).
function CartQtyInput({
  productId,
  qty,
  setQty,
}: {
  productId: number;
  qty: number;
  setQty: (id: number, qty: number) => void;
}) {
  const [draft, setDraft] = useState(String(qty));

  useEffect(() => {
    setDraft(String(qty));
  }, [qty]);

  return (
    <input
      type="number"
      min={0}
      value={draft}
      onChange={(e) => {
        const val = e.target.value;
        setDraft(val);
        if (val !== "") {
          setQty(productId, Math.max(0, Number(val) || 0));
        }
      }}
      onBlur={() => {
        if (draft === "") {
          setDraft("0");
          setQty(productId, 0);
        }
      }}
      className="w-12 text-center border rounded-lg text-black font-bold py-1.5"
    />
  );
}

export default function CartPage() {
  const router = useRouter();
  const { products, cart, addToCart, removeFromCart, setQty, total, itemCount } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const items = products.filter((p) => (cart[p.id] || 0) > 0);
  const deliveryFee = getDeliveryFee(total);
  const freeShippingRemaining = getFreeShippingRemaining(total);
  const freeShippingProgress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  const grandTotal = total + deliveryFee;
  const [showDetails, setShowDetails] = useState(false);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [mostPurchasedIds, setMostPurchasedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchUserPurchaseHistory(user.id).then((h) => {
      setRecentIds(h.recentProductIds);
      setMostPurchasedIds(h.mostPurchasedIds);
    });
  }, [user]);

  const recentProducts = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const mostPurchasedProducts = mostPurchasedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const recommended = products
    .filter((p) => !(cart[p.id] > 0) && p.in_stock !== false)
    .sort((a, b) => {
      const aHot = (a as any).is_hot ? 1 : 0;
      const bHot = (b as any).is_hot ? 1 : 0;
      return bHot - aHot || b.id - a.id;
    })
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8" style={{ paddingBottom: items.length > 0 ? "340px" : "96px" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">{t("cart_title")}</h1>

        {items.length === 0 && <p className="text-center text-gray-500 mt-10">{t("cart_empty")}</p>}

        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.id} className="bg-white border border-green-100 rounded-2xl p-4 flex justify-between items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-xl border border-green-100 flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-black truncate">{p.name}</p>
                  <p className="text-green-700 font-bold">{p.price.toLocaleString()}₩</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => removeFromCart(p.id)}
                  className="w-8 h-10 rounded-lg font-bold"
                  style={{ backgroundColor: "#e5e5e5", color: "#000000" }}
                >
                  −
                </button>
                <CartQtyInput productId={p.id} qty={cart[p.id] || 0} setQty={setQty} />
                <button onClick={() => addToCart(p.id)} aria-label="Ko'paytirish" className="bg-green-600 text-white w-9 h-10 rounded-lg font-bold text-lg flex items-center justify-center">
                  +
                </button>
                <button
                  onClick={() => setQty(p.id, 0)}
                  aria-label="Olib tashlash"
                  className="w-9 h-10 rounded-lg flex items-center justify-center font-bold"
                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {mostPurchasedProducts.length > 0 && (
          <div className="mt-8">
            <ProductRow title={t("cart_most_purchased_title")} products={mostPurchasedProducts} />
          </div>
        )}
        {recentProducts.length > 0 && (
          <div className="mt-2">
            <ProductRow title={t("cart_recent_purchases_title")} products={recentProducts} />
          </div>
        )}

        {recommended.length > 0 && (
          <div className="mt-2">
            <ProductRow title={t("cart_recommend_title")} products={recommended} />
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div
          className="fixed left-0 right-0 z-40"
          style={{
            bottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
            backgroundColor: "#141414",
            borderTop: "1px solid #2a2a2a",
            paddingBottom: "16px",
          }}
        >
          <div className="max-w-2xl mx-auto px-4 pt-3">
            {freeShippingRemaining > 0 ? (
              <p className="text-xs font-bold text-green-500 mb-2">
                {t("free_shipping_progress").replace("{amount}", `${freeShippingRemaining.toLocaleString()}₩`)}
              </p>
            ) : (
              <p className="text-xs font-bold text-green-500 mb-2">{t("free_shipping_reached")}</p>
            )}
            <div className="w-full h-2 bg-green-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${freeShippingProgress}%` }} />
            </div>

            <button
              onClick={() => setShowDetails((v) => !v)}
              className="w-full flex items-center justify-between mb-2"
            >
              <span className="text-sm font-bold" style={{ color: "#a3a3a3" }}>
                {t("cart_details_button")} {showDetails ? "▲" : "▼"}
              </span>
              <span className="text-2xl font-extrabold" style={{ color: "#4ade80" }}>{grandTotal.toLocaleString()}₩</span>
            </button>

            {showDetails && (
              <div className="rounded-xl p-3 mb-2" style={{ backgroundColor: "#1f1f1f" }}>
                <div className="flex justify-between text-sm mb-1" style={{ color: "#e5e5e5" }}>
                  <span>{t("cart_item_count")}</span><span>{itemCount}</span>
                </div>
                <div className="flex justify-between text-sm mb-1" style={{ color: "#a3a3a3" }}>
                  <span>{t("checkout_products")}</span><span>{total.toLocaleString()}₩</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: "#a3a3a3" }}>
                  <span>🚚 {t("delivery_fee")}</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <>
                        <span className="line-through mr-1" style={{ color: "#525252" }}>{DELIVERY_FEE.toLocaleString()}₩</span>
                        <span className="text-green-500 font-bold">0₩</span>
                      </>
                    ) : (
                      `${deliveryFee.toLocaleString()}₩`
                    )}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-lg font-bold"
            >
              {t("cart_place_order")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}