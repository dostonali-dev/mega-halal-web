"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";
import ProductRow from "@/components/ProductRow";
import { DELIVERY_FEE, FREE_SHIPPING_THRESHOLD, getDeliveryFee, getFreeShippingRemaining } from "@/lib/delivery";

export default function CartPage() {
  const router = useRouter();
  const { products, cart, addToCart, removeFromCart, setQty, total, itemCount } = useCart();
  const { t } = useLanguage();
  const items = products.filter((p) => (cart[p.id] || 0) > 0);
  const deliveryFee = getDeliveryFee(total);
  const freeShippingRemaining = getFreeShippingRemaining(total);
  const freeShippingProgress = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  const grandTotal = total + deliveryFee;

  const recommended = products
    .filter((p) => !(cart[p.id] > 0) && p.in_stock !== false)
    .sort((a, b) => {
      const aHot = (a as any).is_hot ? 1 : 0;
      const bHot = (b as any).is_hot ? 1 : 0;
      return bHot - aHot || b.id - a.id;
    })
    .slice(0, 8);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => removeFromCart(p.id)} className="bg-red-500 text-white w-10 h-10 rounded-lg">-</button>
                <input
                  type="number"
                  min={0}
                  value={cart[p.id] || 0}
                  onChange={(e) => setQty(p.id, Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 text-center border rounded-lg text-black font-bold py-1"
                />
                <button onClick={() => addToCart(p.id)} className="bg-green-600 text-white w-10 h-10 rounded-lg">+</button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="bg-white border border-green-100 rounded-2xl p-4 mt-6">
            <div className="mb-4">
              {freeShippingRemaining > 0 ? (
                <p className="text-sm font-bold text-green-700 mb-2">
                  {t("free_shipping_progress").replace("{amount}", `${freeShippingRemaining.toLocaleString()}₩`)}
                </p>
              ) : (
                <p className="text-sm font-bold text-green-700 mb-2">{t("free_shipping_reached")}</p>
              )}
              <div className="w-full h-2.5 bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-black mb-1">
              <span>{t("cart_item_count")}</span><span>{itemCount}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm mb-1">
              <span>{t("checkout_products")}</span><span>{total.toLocaleString()}₩</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm mb-2 pb-2 border-b">
              <span>🚚 {t("delivery_fee")}</span>
              <span>
                {deliveryFee === 0 ? (
                  <>
                    <span className="line-through text-gray-300 mr-1">{DELIVERY_FEE.toLocaleString()}₩</span>
                    <span className="text-green-700 font-bold">0₩</span>
                  </>
                ) : (
                  `${deliveryFee.toLocaleString()}₩`
                )}
              </span>
            </div>
            <div className="flex justify-between text-2xl font-extrabold text-green-700">
              <span>{t("cart_total")}</span><span>{grandTotal.toLocaleString()}₩</span>
            </div>
            <button
              onClick={() => router.push("/checkout")}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl text-lg font-bold"
            >
              {t("cart_place_order")}
            </button>
          </div>
        )}

        {recommended.length > 0 && (
          <div className="mt-8">
            <ProductRow title={t("cart_recommend_title")} products={recommended} />
          </div>
        )}
      </div>
    </main>
  );
}