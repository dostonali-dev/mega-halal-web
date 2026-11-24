"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatSeoulDateTime } from "@/lib/dateUtils";

type Profile = {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  address_detail?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  bonus_balance?: number | null;
};

type Order = {
  id: number;
  user_id: string | null;
  total: number;
  order_text: string;
  status?: string | null;
  created_at: string;
};

type BonusGrant = {
  id: number;
  user_id: string | null;
  amount: number;
  comment: string | null;
  created_at: string;
};

type Customer = Profile & {
  orders: Order[];
  bonusGrants: BonusGrant[];
};

const statusColors: Record<string, string> = {
  "❌ Bekor qilindi": "status-cancelled",
  "📦 Jo'natildi": "status-shipped",
  "✅ To'lov tasdiqlandi": "status-paid",
  "✅ To'landi": "status-paid", // eski buyurtmalar shu matn bilan saqlangan bo'lishi mumkin
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
  const [bonusInputs, setBonusInputs] = useState<Record<string, string>>({});
  const [bonusComments, setBonusComments] = useState<Record<string, string>>({});
  const [grantingId, setGrantingId] = useState<string | null>(null);

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
      const [{ data: profiles }, { data: orders }, { data: bonusGrants }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("id, user_id, total, order_text, status, created_at"),
        supabase.from("bonus_grants").select("id, user_id, amount, comment, created_at"),
      ]);

      const ordersByUser = new Map<string, Order[]>();
      (orders || []).forEach((o) => {
        if (!o.user_id) return;
        const list = ordersByUser.get(o.user_id) || [];
        list.push(o);
        ordersByUser.set(o.user_id, list);
      });

      const bonusGrantsByUser = new Map<string, BonusGrant[]>();
      (bonusGrants || []).forEach((g) => {
        if (!g.user_id) return;
        const list = bonusGrantsByUser.get(g.user_id) || [];
        list.push(g);
        bonusGrantsByUser.set(g.user_id, list);
      });

      const merged: Customer[] = (profiles || []).map((p) => ({
        ...p,
        orders: (ordersByUser.get(p.id) || []).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        bonusGrants: (bonusGrantsByUser.get(p.id) || []).sort(
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

  // Mijozga qo'lda bonus taqdim qilish (masalan telefon orqali murojaat
  // qilganda yoki boshqa sabab bilan) - kiritilgan miqdor mavjud balansga
  // qo'shiladi (o'rniga qo'yilmaydi).
  const handleGrantBonus = async (c: Customer) => {
    const raw = bonusInputs[c.id];
    const amount = Number(raw);
    const comment = (bonusComments[c.id] || "").trim();
    if (!raw || !amount || amount <= 0) {
      alert("Bonus miqdorini to'g'ri kiriting.");
      return;
    }
    const confirmText = comment
      ? `${c.name} (${c.phone})ga ${amount.toLocaleString()}₩ bonus berilsinmi?\n\nIzoh: ${comment}`
      : `${c.name} (${c.phone})ga ${amount.toLocaleString()}₩ bonus berilsinmi?`;
    if (!confirm(confirmText)) return;
    setGrantingId(c.id);
    try {
      // Atomik RPC orqali qo'shamiz (joriy balansni o'qib, ustiga qo'shib,
      // qaytadan yozish o'rniga) - shu bilan eski (mahalliy) balans
      // ma'lumoti eskirgan bo'lsa ham, haqiqiy balansni noto'g'ri qiymat
      // bilan ustidan yozib yuborish xavfi bo'lmaydi.
      const { data: newBalance, error } = await supabase.rpc("increment_bonus_balance", {
        p_user_id: c.id,
        p_delta: amount,
      });
      if (error) {
        alert("Xatolik: " + error.message);
        return;
      }

      // Har bir berilgan bonusni tarix sifatida saqlaymiz (sana, miqdor,
      // izoh) - "Berilgan bonuslar tarixi" shu yozuvlar asosida chiqadi.
      const { data: grantRow, error: grantError } = await supabase
        .from("bonus_grants")
        .insert({ user_id: c.id, amount, comment: comment || null })
        .select()
        .single();
      if (grantError) {
        console.error(grantError);
        // Balans allaqachon yangilandi - faqat tarixga yozib bo'lmadi,
        // shuning uchun bu xatoni alohida ko'rsatamiz.
        alert("Bonus berildi, lekin tarixga yozishda xatolik: " + grantError.message);
      }

      setCustomers((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? {
                ...x,
                bonus_balance: newBalance ?? (x.bonus_balance || 0) + amount,
                bonusGrants: grantRow ? [grantRow as BonusGrant, ...x.bonusGrants] : x.bonusGrants,
              }
            : x
        )
      );
      setBonusInputs((prev) => ({ ...prev, [c.id]: "" }));
      setBonusComments((prev) => ({ ...prev, [c.id]: "" }));
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    } finally {
      setGrantingId(null);
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
      <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">👥 Mijozlar</h1>

      <div className="max-w-3xl bg-white rounded-2xl shadow border p-4 mb-6 space-y-3">
        <input
          type="text"
          placeholder="🔎 Ism bo'yicha qidirish..."
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className="w-full border rounded-xl p-3 text-black bg-white"
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
                  {c.avatar_url ? (
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-green-100"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                      {index + 1}
                    </span>
                  )}
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
                  {c.avatar_url && (
                    <img
                      src={c.avatar_url}
                      alt={c.name}
                      className="w-16 h-16 rounded-full object-cover border border-green-100 mb-3"
                    />
                  )}
                  <p className="text-black text-sm">
                    📅 Ro'yxatdan o'tgan: {c.created_at ? formatSeoulDateTime(c.created_at) : "—"}
                  </p>
                  <p className="text-black text-sm mt-1">📱 {c.phone}</p>
                  <p className="text-black text-sm mt-1">
                    📍 {c.address ? `${c.address}${c.address_detail ? `, ${c.address_detail}` : ""}` : "Manzil kiritilmagan"}
                  </p>
                  {lastOrderDate && (
                    <p className="text-black text-sm mt-1">🕓 Oxirgi buyurtma: {formatSeoulDateTime(lastOrderDate)}</p>
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

                  <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2">
                      🎁 Mijozga bonus taqdim qilish. Mavjud bonus:{" "}
                      <span className="font-bold text-green-700">{(c.bonus_balance || 0).toLocaleString()}₩</span>
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1}
                          placeholder="Masalan: 10000"
                          value={bonusInputs[c.id] || ""}
                          onChange={(e) => setBonusInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          className="w-full border rounded-xl p-2 pr-7 text-black bg-white"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₩</span>
                      </div>
                      <button
                        onClick={() => handleGrantBonus(c)}
                        disabled={grantingId === c.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl whitespace-nowrap"
                      >
                        {grantingId === c.id ? "..." : "🎁 Bonus berish"}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Izoh (ixtiyoriy) — masalan: telefon orqali murojaat"
                      value={bonusComments[c.id] || ""}
                      onChange={(e) => setBonusComments((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-full border rounded-xl p-2 text-black bg-white text-sm"
                    />

                    {c.bonusGrants.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-gray-500 mb-1">📜 Berilgan bonuslar tarixi:</p>
                        <div className="space-y-1">
                          {c.bonusGrants.map((g) => (
                            <div key={g.id} className="flex justify-between items-start gap-2 bg-white border border-green-100 rounded-lg px-2 py-1.5 text-xs">
                              <div className="min-w-0">
                                <span className="font-bold text-green-700">+{g.amount.toLocaleString()}₩</span>
                                {g.comment && <span className="text-gray-500"> — {g.comment}</span>}
                              </div>
                              <span className="text-gray-400 whitespace-nowrap flex-shrink-0">{formatSeoulDateTime(g.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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
                            <p className="text-xs text-gray-500 mb-1">{formatSeoulDateTime(o.created_at)}</p>
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
