"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";
import { formatSeoulDateTime } from "@/lib/dateUtils";
import PageHeader from "@/components/PageHeader";
import OrderRating from "@/components/OrderRating";

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

// Bitta buyurtmaning to'liq tafsilotlari - /profile/orders ro'yxatidagi
// bir qatorni bosganda shu sahifa ochiladi.
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const { user } = useAuth();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
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
          <p className="text-sm text-black whitespace-pre-line">{order.order_text}</p>
          {status === "📦 Jo'natildi" && <OrderRating orderId={order.id} />}
        </div>
      </div>
    </main>
  );
}
