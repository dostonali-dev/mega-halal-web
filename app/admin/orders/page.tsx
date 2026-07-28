"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatSeoulDate, formatSeoulTime, seoulDateKey } from "@/lib/dateUtils";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") {
      router.push("/admin");
    } else {
      setCheckedLogin(true);
    }
  }, [router]);

  useEffect(() => {
    if (checkedLogin) loadOrders();
  }, [checkedLogin]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setOrders(data || []);
  };

  const statusColors: Record<string, string> = {
    "❌ Bekor qilindi": "status-cancelled",
    "📦 Jo'natildi": "status-shipped",
    "✅ To'landi": "status-paid",
  };

  const handleExportExcel = async () => {
    if (orders.length === 0) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = orders.map((o) => ({
        "Buyurtma raqami": o.id,
        "Sana": formatSeoulDate(o.created_at),
        "Vaqt": formatSeoulTime(o.created_at),
        "Mijoz ismi": o.customer_name || "",
        "Mijoz telefon raqami": o.phone || "",
        "Manzil (ko'cha)": o.address_main || o.address || "",
        "Qo'shimcha manzil (uy/xonadon)": o.address_detail || "",
        "Mahsulotlar": (o.order_text || "").replace(/\n/g, "; "),
        "Jami summa (₩)": o.total || 0,
        "Holat": o.status || "Kutilmoqda",
        "Izoh": o.note || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 14 },
        { wch: 30 }, { wch: 24 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Buyurtmalar");
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `mega-halal-buyurtmalar-${today}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  // Buyurtmalarni kun bo'yicha guruhlash (Koreya vaqti bo'yicha)
  const groups: { dateKey: string; label: string; items: any[] }[] = [];
  for (const order of orders) {
    const key = seoulDateKey(order.created_at);
    const last = groups[groups.length - 1];
    if (last && last.dateKey === key) {
      last.items.push(order);
    } else {
      groups.push({ dateKey: key, label: formatSeoulDate(order.created_at), items: [order] });
    }
  }

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
        <button
          onClick={handleExportExcel}
          disabled={exporting || orders.length === 0}
          className="bg-green-600 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl"
        >
          {exporting ? "Tayyorlanmoqda..." : "📤 Excel yuklab olish"}
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-6">📦 Buyurtmalar</h1>

      <div className="max-w-3xl">
        {groups.map((group) => (
          <div key={group.dateKey}>
            <div className="relative flex items-center py-4">
              <div className="flex-1 border-t-2 border-gray-200" />
              <span className="px-3 text-sm font-bold text-gray-500 whitespace-nowrap">{group.label}</span>
              <div className="flex-1 border-t-2 border-gray-200" />
            </div>

            <div className="space-y-3">
              {group.items.map((order) => {
                const isOpen = expandedId === order.id;
                const statusClass = statusColors[order.status] || "status-pending";
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow border">
                    <button
                      onClick={() => setExpandedId(isOpen ? null : order.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {order.receipt_image && (
                          <img src={order.receipt_image} alt="chek" className="w-10 h-10 object-cover rounded-lg border flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-black truncate">№{order.id} · {order.customer_name}</p>
                          <p className="text-xs text-gray-500 truncate">{order.phone} · {formatSeoulTime(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-green-700">{order.total?.toLocaleString()}₩</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusClass}`}>
                          {order.status || "⏳ Kutilmoqda"}
                        </span>
                        <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 border-t pt-3">
                        <p className="text-xs text-gray-400 mb-1">🕓 {formatSeoulDate(order.created_at)}, {formatSeoulTime(order.created_at)}</p>
                        <p className="text-black">📍 {order.address}</p>
                        {order.note && <p className="mt-1 text-gray-700">📝 {order.note}</p>}

                        <div className="mt-3 p-3 bg-gray-100 rounded-xl">
                          <p className="font-semibold text-black mb-2">🛒 Buyurtma:</p>
                          <pre className="whitespace-pre-wrap text-sm text-black">{order.order_text}</pre>
                        </div>

                        {order.receipt_image && (
                          <div className="mt-3">
                            <p className="font-semibold text-black mb-2">📷 To'lov cheki (kattalashtirish uchun bosing)</p>
                            <img
                              src={order.receipt_image}
                              alt="receipt"
                              onClick={() => setZoomedImage(order.receipt_image)}
                              className="max-w-[160px] rounded-xl border cursor-pointer"
                            />
                          </div>
                        )}

                        {order.status !== "📦 Jo'natildi" && order.status !== "❌ Bekor qilindi" && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={async () => {
                                await supabase.from("orders").update({ status: "✅ To'landi" }).eq("id", order.id);

                                await fetch("/api/order/paid", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ orderNumber: order.id, status: "paid" }),
                                });

                                loadOrders();
                              }}
                              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
                            >
                              ✅ To'landi
                            </button>
                            <button
                              onClick={async () => {
                                await supabase.from("orders").update({ status: "📦 Jo'natildi" }).eq("id", order.id);

                                await fetch("/api/order/paid", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ orderNumber: order.id, status: "shipped" }),
                                });

                                loadOrders();
                              }}
                              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
                            >
                              📦 Jo'natildi
                            </button>
                            <button
                              onClick={async () => {
                                await supabase.from("orders").update({ status: "❌ Bekor qilindi" }).eq("id", order.id);

                                await fetch("/api/order/paid", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ orderNumber: order.id, status: "cancelled" }),
                                });

                                loadOrders();
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm"
                            >
                              ❌ Bekor qilindi
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="chek katta" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </main>
  );
}
