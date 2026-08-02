"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  formatSeoulDate,
  seoulDateKey,
  seoulDateToUTCISOStart,
  addSeoulDays,
  todaySeoulDateKey,
} from "@/lib/dateUtils";

type OrderRow = {
  id: number;
  total: number | null;
  status: string | null;
  phone: string | null;
  user_id: string | null;
  customer_name: string | null;
  created_at: string;
};

// Admin uchun kunlik savdo hisoboti: tanlangan sana oralig'ida har kuni
// qancha savdo bo'lgani, nechta buyurtma tushgani, nechta (noyob) mijoz
// buyurtma bergani va nechta mahsulot sotilgani ko'rsatiladi.
// "❌ Bekor qilindi" statusidagi buyurtmalar hisobga OLINMAYDI - chunki
// ular haqiqatda sotilmagan.
export default function AdminReportsPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => addSeoulDays(todaySeoulDateKey(), -6));
  const [endDate, setEndDate] = useState(() => todaySeoulDateKey());
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [qtyByOrder, setQtyByOrder] = useState<Record<number, number>>({});

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const fromISO = seoulDateToUTCISOStart(startDate);
      const toISO = seoulDateToUTCISOStart(addSeoulDays(endDate, 1));
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("id, total, status, phone, user_id, customer_name, created_at")
        .gte("created_at", fromISO)
        .lt("created_at", toISO)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        setOrders([]);
        setQtyByOrder({});
        setLoading(false);
        return;
      }

      const valid = (ordersData || []).filter((o) => o.status !== "❌ Bekor qilindi") as OrderRow[];
      const orderIds = valid.map((o) => o.id);

      let qtyMap: Record<number, number> = {};
      if (orderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("order_id, quantity")
          .in("order_id", orderIds);
        (itemsData || []).forEach((r: any) => {
          qtyMap[r.order_id] = (qtyMap[r.order_id] || 0) + (r.quantity || 0);
        });
      }

      setOrders(valid);
      setQtyByOrder(qtyMap);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (checkedLogin) loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedLogin, startDate, endDate]);

  const dayGroups = useMemo(() => {
    const map = new Map<
      string,
      { dateKey: string; label: string; total: number; orderCount: number; customers: Set<string>; productCount: number }
    >();
    for (const o of orders) {
      const key = seoulDateKey(o.created_at);
      if (!map.has(key)) {
        map.set(key, {
          dateKey: key,
          label: formatSeoulDate(o.created_at),
          total: 0,
          orderCount: 0,
          customers: new Set(),
          productCount: 0,
        });
      }
      const g = map.get(key)!;
      g.total += o.total || 0;
      g.orderCount += 1;
      g.customers.add(o.phone || o.user_id || o.customer_name || `buyurtma-${o.id}`);
      g.productCount += qtyByOrder[o.id] || 0;
    }
    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [orders, qtyByOrder]);

  const overall = useMemo(() => {
    const total = orders.reduce((s, o) => s + (o.total || 0), 0);
    const customers = new Set(orders.map((o) => o.phone || o.user_id || o.customer_name || `buyurtma-${o.id}`));
    const products = orders.reduce((s, o) => s + (qtyByOrder[o.id] || 0), 0);
    return { total, orderCount: orders.length, customerCount: customers.size, productCount: products };
  }, [orders, qtyByOrder]);

  const setQuickRange = (days: number) => {
    setEndDate(todaySeoulDateKey());
    setStartDate(addSeoulDays(todaySeoulDateKey(), -(days - 1)));
  };

  const setThisMonth = () => {
    const today = todaySeoulDateKey();
    setStartDate(`${today.slice(0, 7)}-01`);
    setEndDate(today);
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-8">
      <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-3xl font-bold mt-3 mb-1">📊 Hisobot</h1>
      <p className="text-gray-500 mb-5">Kunlik savdo, buyurtma, mijoz va sotilgan mahsulot statistikasi</p>

      <div className="max-w-3xl">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setQuickRange(1)} className="bg-gray-100 text-black text-sm font-bold px-3 py-2 rounded-xl">Bugun</button>
          <button onClick={() => setQuickRange(7)} className="bg-gray-100 text-black text-sm font-bold px-3 py-2 rounded-xl">So'nggi 7 kun</button>
          <button onClick={() => setQuickRange(30)} className="bg-gray-100 text-black text-sm font-bold px-3 py-2 rounded-xl">So'nggi 30 kun</button>
          <button onClick={setThisMonth} className="bg-gray-100 text-black text-sm font-bold px-3 py-2 rounded-xl">Shu oy</button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <input
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2.5 rounded-xl bg-white text-black text-sm"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={todaySeoulDateKey()}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2.5 rounded-xl bg-white text-black text-sm"
          />
          {loading && <span className="text-sm text-gray-400">Yuklanmoqda...</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-xs font-bold" style={{ color: "#166534" }}>💰 Jami savdo</p>
            <p className="text-xl font-extrabold mt-1" style={{ color: "#000000" }}>{overall.total.toLocaleString()}₩</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p className="text-xs font-bold" style={{ color: "#1e40af" }}>📦 Buyurtmalar</p>
            <p className="text-xl font-extrabold mt-1" style={{ color: "#000000" }}>{overall.orderCount}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a" }}>
            <p className="text-xs font-bold" style={{ color: "#a16207" }}>👥 Mijozlar</p>
            <p className="text-xl font-extrabold mt-1" style={{ color: "#000000" }}>{overall.customerCount}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#fdf2f8", border: "1px solid #fbcfe8" }}>
            <p className="text-xs font-bold" style={{ color: "#9d174d" }}>🛒 Sotilgan mahsulot</p>
            <p className="text-xl font-extrabold mt-1" style={{ color: "#000000" }}>{overall.productCount}</p>
          </div>
        </div>

        {!loading && dayGroups.length === 0 && (
          <p className="text-center text-gray-400 mt-10">Shu sana oralig'ida buyurtma topilmadi.</p>
        )}

        <div className="space-y-3">
          {dayGroups.map((g) => (
            <div key={g.dateKey} className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="font-bold text-black mb-2">{g.label}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">Savdo</p>
                  <p className="font-bold text-green-700">{g.total.toLocaleString()}₩</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Buyurtma</p>
                  <p className="font-bold text-black">{g.orderCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mijoz</p>
                  <p className="font-bold text-black">{g.customers.size}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mahsulot</p>
                  <p className="font-bold text-black">{g.productCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
