"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Admin panelidan mijozlar ilovasiga (barcha obunachilarga) qo'lda push
// bildirishnoma yozib yuborish - masalan "Bugun aksiya bor!" kabi e'lonlar
// uchun. Yuborish server tomonida (/api/admin/broadcast-push) amalga oshadi,
// chunki OneSignal REST API kaliti brauzerga chiqmasligi kerak.
export default function AdminPushPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") {
      router.push("/admin");
    } else {
      setCheckedLogin(true);
    }
  }, [router]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert("Sarlavha va matnni to'ldiring.");
      return;
    }
    if (!confirm("Bu xabar ilovaga o'rnatilgan BARCHA mijozlarga yuboriladi. Davom etasizmi?")) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, url: url.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Xatolik: " + (data.error || "Noma'lum xatolik"));
      } else {
        alert("Xabar yuborildi ✅");
        setTitle("");
        setMessage("");
        setUrl("");
      }
    } catch (e) {
      alert("Tarmoq xatoligi.");
      console.error(e);
    }
    setSending(false);
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-8">
      <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-3xl font-bold mt-3 mb-1">📣 Push xabar</h1>
      <p className="text-gray-500 mb-6">Ilovani o'rnatgan barcha mijozlarga push bildirishnoma yuboring.</p>

      <div className="max-w-lg bg-white border rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-bold text-black mb-1">Sarlavha</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: 🎉 Bugun aksiya!"
            className="w-full border rounded-xl p-3 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-black mb-1">Xabar matni</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Barcha mahsulotlarga 10% chegirma, faqat bugun!"
            className="w-full border rounded-xl p-3 text-black"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-black mb-1">Havola (ixtiyoriy)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/discounts"
            className="w-full border rounded-xl p-3 text-black"
          />
          <p className="text-xs text-gray-400 mt-1">Bosilganda ilova ichida shu sahifa ochiladi (masalan /discounts). Bo'sh qoldirsangiz bosh sahifa ochiladi.</p>
        </div>
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-green-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl"
        >
          {sending ? "Yuborilmoqda..." : "📤 Yuborish"}
        </button>
      </div>
    </main>
  );
}
