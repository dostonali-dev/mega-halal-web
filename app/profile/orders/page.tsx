"use client";
import { useEffect, useState } from "react";
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

export default function OrdersHistoryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setOrders(data);
      setLoading(false);
    };
    loadOrders();
  }, [user]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-10">
      <PageHeader title={`🧾 ${t("profile_menu_orders")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        {loading && <p className="text-gray-400 text-sm">{t("orders_loading")}</p>}
        {!loading && orders.length === 0 && <p className="text-gray-400 text-sm">{t("orders_empty")}</p>}

        <div className="space-y-3">
          {orders.map((o) => {
            const status = o.status || "";
            const statusKey = STATUS_KEY_MAP[status];
            const statusLabel = statusKey ? t(statusKey) : t("order_status_pending");
            const statusClass = STATUS_COLOR_MAP[status] || "status-pending";
            return (
              <div key={o.id} className="bg-white border border-green-100 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-black">{t("checkout_success_order_no")} {o.id}</span>
                  <span className="text-green-700 font-bold">{o.total.toLocaleString()}₩</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{formatSeoulDateTime(o.created_at)}</p>
                <div className="flex gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusClass}`}>{statusLabel}</span>
                </div>
                <p className="text-sm text-black whitespace-pre-line">{o.order_text}</p>
                {status === "📦 Jo'natildi" && <OrderRating orderId={o.id} />}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}