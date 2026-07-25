"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  address_detail?: string | null;
  created_at?: string;
};

type Order = {
  id: number;
  user_id: string | null;
  total: number;
  order_text: string;
  status?: string | null;
  created_at: string;
};

type Customer = Profile & {
  orders: Order[];
};

const statusColors: Record<string, string> = {
  "❌ Bekor qilindi": "status-cancelled",
  "📦 Jo'natildi": "status-shipped",
  "✅ To'landi": "status-paid",
};

export default function CustomersPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameQuery, setNameQuery] = useState("");
  const [sortMode, setSortMode] = useState<"new" | "orders" | "name">("new");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") {
      router.push("/admin");
    } else {
      setCheckedLogin(true);
    }
  }, [router]);

  useEffect(() => {
    if (!checkedLogin) return;
    const load = async () => {
      setLoading(true);
      const [{ data: profiles }, { data: orders }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("id, user_id, total, order_text, status, created_at"),
      ]);

      const ordersByUser = new Map<string, Order[]>();
      (orders || []).forEach((o) => {
        if (!o.user_id) return;
        const list = ordersByUser.get(o.user_id) || [];
        list.push(o);
        ordersByUser.set(o.user_id, list);
      });

      const merged: Customer[] = (profiles || []).map((p) => ({
        ...p,
        orders: (ordersByUser.get(p.id) || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));

      setCustomers(merged);
      setLoading(false);
    };
    load();
  }, [checkedLogin]);

  const generatePassword = () => String(Math.floor(100000 + Math.random() * 900000));

  const handleResetPassword = async (c: Customer) => {
    if (!confirm(`${c.name} (${c.phone}) uchun YANGI parol o'rnatilsinmi? Eski parol ishlamay qoladi.`)) return;
    setResettingId(c.id);
    try {
      const newPassword = generatePassword();
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: c.id,
          newPassword,
          adminSecret: process.env.NEXT_PUBLIC_ADMIN_API_SECRET,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Xatolik: " + (data.error || "noma'lum xatolik"));
        return;
      }
      setNewPasswords((prev) => ({ ...prev, [c.id]: newPassword }));
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    } finally {
      setResettingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = customers;
    if (nameQuery.trim()) {
      const q = nameQuery.trim().toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q));
    }
    const sorted = [...list];
    if (sortMode === "orders") {
      sorted.sort((a, b) => b.orders.length - a.orders.length);
    } else if (sortMode === "name") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      sorted.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    return sorted;
  }, [customers, nameQuery, sortMode]);

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-8">
      <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">👥 Mijozlar</h1>

      <div className="max-w-3xl bg-white rounded-2xl shadow border p-4 mb-6 space-y-3">
        <input
          type="text"
          placeholder="🔎 Ism bo'yicha qidirish..."
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className="w-full border rounded-xl p-3 text-black"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSortMode("new")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${sortMode === "new" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}
          >
            🆕 Yangi ro'yxatdan o'tganlar
          </button>
          <button
            onClick={() => setSortMode("orders")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${sortMode === "orders" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}
          >
            📦 Buyurtmalar soni bo'yicha
          </button>
          <button
            onClick={() => setSortMode("name")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${sortMode === "name" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}
          >
            🔤 Ism bo'yicha (A-Z)
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400">Yuklanmoqda...</p>}
      {!loading && filtered.length === 0 && <p className="text-gray-400">Mijoz topilmadi</p>}

      <div className="space-y-3 max-w-3xl">
        {filtered.map((c, index) => {
          const isOpen = expandedId === c.id;
          const lastOrderDate = c.orders[0]?.created_at;
          return (
            <div key={c.id} className="bg-white rounded-2xl shadow border">
              <button
                onClick={() => setExpandedId(isOpen ? null : c.id)}
                className="w-full p-4 flex items-center justify-between text-left gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-black truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {c.orders.length} buyurtma
                  </span>
                  <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t pt-3">
                  <p className="text-black text-sm">
                    📅 Ro'yxatdan o'tgan: {c.created_at ? new Date(c.created_at).toLocaleString() : "—"}
                  </p>
                  <p className="text-black text-sm mt-1">📱 {c.phone}</p>
                  <p className="text-black text-sm mt-1">
                    📍 {c.address ? `${c.address}${c.address_detail ? `, ${c.address_detail}` : ""}` : "Manzil kiritilmagan"}
                  </p>
                  {lastOrderDate && (
                    <p className="text-black text-sm mt-1">🕓 Oxirgi buyurtma: {new Date(lastOrderDate).toLocaleString()}</p>
                  )}

                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2">
                      🔑 Mijoz parolini unutgan bo'lsa (qo'ng'iroq/telegram orqali murojaat qilganda),
                      shu yerdan yangi parol yaratib, telefon orqali ayting.
                    </p>
                    {newPasswords[c.id] ? (
                      <div className="bg-white border border-green-200 rounded-lg p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Yangi parol (mijozga ayting):</p>
                          <p className="text-lg font-bold text-green-700 tracking-widest">{newPasswords[c.id]}</p>
                        </div>
                        <button
                          onClick={() => handleResetPassword(c)}
                          disabled={resettingId === c.id}
                          className="text-xs font-bold text-blue-600 underline whitespace-nowrap"
                        >
                          Yana yangisi
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleResetPassword(c)}
                        disabled={resettingId === c.id}
                        className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl"
                      >
                        {resettingId === c.id ? "Yaratilmoqda..." : "🔑 Yangi parol yaratish"}
                      </button>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-black mb-2">🧾 Buyurtmalar tarixi ({c.orders.length}):</p>
                    {c.orders.length === 0 && <p className="text-gray-400 text-sm">Hali buyurtma yo'q</p>}
                    <div className="space-y-2">
                      {c.orders.map((o) => {
                        const statusClass = statusColors[o.status || ""] || "status-pending";
                        return (
                          <div key={o.id} className="bg-gray-100 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-black text-sm">№{o.id}</span>
                              <span className="font-bold text-green-700 text-sm">{o.total?.toLocaleString()}₩</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">{new Date(o.created_at).toLocaleString()}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusClass}`}>
                              {o.status || "⏳ Kutilmoqda"}
                            </span>
                            <pre className="whitespace-pre-wrap text-xs text-black mt-2">{o.order_text}</pre>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
