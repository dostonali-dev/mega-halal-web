"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-8">
      <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">📦 Buyurtmalar</h1>

      <div className="space-y-3 max-w-3xl">
        {orders.map((order) => {
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
                    <p className="text-xs text-gray-500 truncate">{order.phone}</p>
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