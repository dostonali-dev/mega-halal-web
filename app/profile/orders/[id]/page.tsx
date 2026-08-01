"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { formatSeoulDateTime } from "@/lib/dateUtils";
import PageHeader from "@/components/PageHeader";
import OrderRating from "@/components/OrderRating";
import ProductImage from "@/components/ProductImage";

const STATUS_KEY_MAP: Record<string, "order_status_paid" | "order_status_shipped" | "order_status_cancelled"> = {
  "✅ To'landi": "order_status_paid",
  "📦 Jo'natildi": "order_status_shipped",
  "❌ Bekor qilindi": "order_status_cancelled",
};
const STATUS_COLOR_MAP: Record<string, string> = {
  "✅ To'landi": "status-paid",
  "📦 Jo'natildi": "status-shipped",
  "❌ Bekor qilindi": "status-cancelled",
};

type Order = {
  id: number;
  order_text: string;
  total: number;
  created_at: string;
  status?: string | null;
};

type OrderItem = {
  id: number;
  product_id: number | null;
  product_name: string | null;
  quantity: number;
  price: number;
  image?: string | null;
};

// Bitta buyurtmaning to'liq tafsilotlari - /profile/orders ro'yxatidagi
// bir qatorni bosganda shu sahifa ochiladi.
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      if (!user || !orderId) return;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) setOrder(data);

      // Buyurtma tarkibidagi mahsulotlarni rasmi bilan ko'rsatish uchun
      // "order_items" jadvalidan olib, mavjud mahsulot rasmlarini
      // "products" jadvalidan qo'shib qo'yamiz (mahsulot keyinchalik
      // o'chirilgan yoki rasmi o'zgargan bo'lsa ham, nomi/narxi saqlanadi).
      const { data: itemRows } = await supabase
        .from("order_items")
        .select("id, product_id, product_name, quantity, price")
        .eq("order_id", orderId);

      if (itemRows && itemRows.length > 0) {
        const productIds = itemRows.map((r) => r.product_id).filter((id): id is number => id != null);
        let imageMap: Record<number, string | null> = {};
        if (productIds.length > 0) {
          const { data: productsData } = await supabase.from("products").select("id, image").in("id", productIds);
          (productsData || []).forEach((p: any) => {
            imageMap[p.id] = p.image;
          });
        }
        setItems(
          itemRows.map((r) => ({
            ...r,
            image: r.product_id != null ? imageMap[r.product_id] : null,
          }))
        );
      }

      setLoading(false);
    };
    loadOrder();
  }, [user, orderId]);

  const title = `🧾 ${t("checkout_success_order_no")} ${orderId || ""}`;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-10">
        <PageHeader title={title} />
        <div className="max-w-md mx-auto p-4 md:p-8">
          <p className="text-gray-400 text-sm">{t("orders_loading")}</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-10">
        <PageHeader title={title} />
        <div className="max-w-md mx-auto p-4 md:p-8">
          <p className="text-gray-400 text-sm">{t("orders_empty")}</p>
        </div>
      </main>
    );
  }

  const status = order.status || "";
  const statusKey = STATUS_KEY_MAP[status];
  const statusLabel = statusKey ? t(statusKey) : t("order_status_pending");
  const statusClass = STATUS_COLOR_MAP[status] || "status-pending";

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-10">
      <PageHeader title={`🧾 ${t("checkout_success_order_no")} ${order.id}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-xl p-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-black">{t("checkout_success_order_no")} {order.id}</span>
            <span className="text-green-700 font-bold text-lg">{order.total.toLocaleString()}₩</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">{formatSeoulDateTime(order.created_at)}</p>
          <div className="flex gap-2 mb-3">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusClass}`}>{statusLabel}</span>
          </div>
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b pb-2 last:border-b-0">
                  <ProductImage image={item.image} alt={item.product_name || ""} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" compact />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-black truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString()}₩</p>
                  </div>
                  <span className="text-sm font-bold text-black flex-shrink-0">
                    {(item.quantity * item.price).toLocaleString()}₩
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-black whitespace-pre-line">{order.order_text}</p>
          )}
          {status === "📦 Jo'natildi" && <OrderRating orderId={order.id} />}
        </div>
      </div>
    </main>
  );
}
