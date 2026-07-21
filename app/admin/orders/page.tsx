"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    <div className="flex gap-3 mb-8">

      <Link
        href="/admin"
        className="bg-green-600 text-white px-4 py-3 rounded-xl"
      >
        ⬅️ Mahsulotlar
      </Link>

      <Link
        href="/admin/orders"
        className="bg-blue-600 text-white px-4 py-3 rounded-xl"
      >
        📦 Buyurtmalar
      </Link>

    </div>

    <h1 className="text-4xl font-bold mb-8">
      📦 Buyurtmalar
    </h1>

    ...

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl shadow p-5 border"
          >
            <h2 className="text-2xl font-bold text-black">
  № {order.id}
</h2>

            <p className="text-black font-semibold">
  👤 {order.customer_name}
</p>

<p className="text-black">
  📞 {order.phone}
</p>

<p className="text-black">
  📍 {order.address}
</p>
{order.receipt_image && (
  <div className="mt-3">
    <p className="font-semibold text-black mb-2">
      📷 To'lov cheki
    </p>

    <a
      href={order.receipt_image}
      target="_blank"
      rel="noreferrer"
    >
      <img
        src={order.receipt_image}
        alt="receipt"
        className="max-w-xs rounded-xl border"
      />
    </a>
  </div>
)}
            {order.note && (
  <p className="mt-2 text-gray-700">
    📝 {order.note}
  </p>
)}
            <div className="mt-3 p-3 bg-gray-100 rounded-xl">
  <p className="font-semibold text-black mb-2">
    🛒 Buyurtma:
  </p>

  <pre className="whitespace-pre-wrap text-sm text-black">
    {order.order_text}
  </pre>
</div>

            <p className="font-bold text-green-700 mt-2">
              💰 {order.total?.toLocaleString()}₩
            </p>
   <p
  className={`mt-2 font-bold ${
    order.status === "❌ Bekor qilindi"
      ? "text-red-600"
      : order.status === "📦 Jo'natildi"
      ? "text-blue-600"
      : order.status === "✅ To'landi"
      ? "text-green-600"
      : "text-yellow-600"
  }`}
>
  {order.status}
</p>

{order.status !== "📦 Jo'natildi" &&
 order.status !== "❌ Bekor qilindi" && (

<div className="flex gap-2 mt-4">
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
  <button
  onClick={async () => {
    await supabase
      .from("orders")
      .update({
        status: "❌ Bekor qilindi",
      })
      .eq("id", order.id);

    loadOrders();
  }}
  className="bg-red-600 text-white px-4 py-2 rounded-xl"
>
  ❌ Bekor qilindi
</button>
</div>

)}
          </div>
        ))}
      </div>
    </main>
  );
}