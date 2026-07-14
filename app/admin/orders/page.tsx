"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

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

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        📦 Buyurtmalar
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl shadow p-5 border"
          >
            <h2 className="text-xl font-bold">
              № {order.id + 100}
            </h2>

            <p>👤 {order.customer_name}</p>
            <p>📞 {order.phone}</p>
            <p>📍 {order.address}</p>

            <p className="font-bold text-green-700 mt-2">
              💰 {order.total?.toLocaleString()}₩
            </p>
            <p className="mt-2 font-bold">
  {order.status}
</p><div className="flex gap-2 mt-4">
  <button
    onClick={async () => {
      await supabase
        .from("orders")
        .update({
          status: "✅ To'landi",
        })
        .eq("id", order.id);

      loadOrders();
    }}
    className="bg-green-600 text-white px-4 py-2 rounded-xl"
  >
    ✅ To'landi
  </button>

  <button
    onClick={async () => {
      await supabase
        .from("orders")
        .update({
          status: "📦 Jo'natildi",
        })
        .eq("id", order.id);

      loadOrders();
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
  >
    📦 Jo'natildi
  </button>
</div>
          </div>
        ))}
      </div>
    </main>
  );
}