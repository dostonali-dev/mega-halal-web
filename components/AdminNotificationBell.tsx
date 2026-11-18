"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatSeoulDateTime } from "@/lib/dateUtils";

type AdminNotification = {
  id: number;
  title: string;
  message: string;
  url: string | null;
  push_ok: boolean | null;
  push_error: string | null;
  read: boolean;
  created_at: string;
};

// Admin ilovasining o'ng-yuqori burchagida doim ko'rinadigan 🔔
// qo'ng'iroqcha - bosilganda "admin_notifications" jadvalidagi tarixni
// (masalan "Yangi buyurtma keldi" push xabarlari) ro'yxat qilib ko'rsatadi.
// Bu push o'zi (OneSignal orqali) qurilmaga yetib bormagan taqdirda ham,
// admin shu yerdan "nima yuborilgan edi" - deb tekshira oladi (push_ok/
// push_error ustunlari orqali - lib/onesignal.ts'dagi sendAdminPush yozadi).
export default function AdminNotificationBell() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    const { count } = await supabase
      .from("admin_notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    setUnreadCount(count || 0);
  };

  useEffect(() => {
    // Login sahifasida (hali kirilmagan bo'lsa) qo'ng'iroqcha ko'rinmasin -
    // bu komponent barcha /admin sahifalarini o'rab turuvchi layout'da
    // ishlatilgani uchun, shu tekshiruv kerak.
    setLoggedIn(localStorage.getItem("adminLoggedIn") === "true");
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    loadUnreadCount();
    // Admin ilovasi ochiq turganda, yangi bildirishnoma kelishi bilan
    // qizil nishonning soni yangilanib tursin uchun davriy tekshirish.
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  if (!loggedIn) return null;

  const openPanel = async () => {
    setOpen(true);
    setLoading(true);
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const markRead = async (n: AdminNotification) => {
    if (!n.read) {
      await supabase.from("admin_notifications").update({ read: true }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (n.url) {
      setOpen(false);
      router.push(n.url);
    }
  };

  const markAllRead = async () => {
    await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  return (
    <>
      <button
        onClick={openPanel}
        aria-label="Bildirishnomalar"
        className="flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0 relative"
        style={{
          backgroundColor: "#16a34a",
          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full"
            style={{ top: "-2px", right: "-2px", minWidth: "18px", height: "18px", padding: "0 4px" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
            >
              <h2 className="font-bold text-lg text-black">🔔 Bildirishnomalar</h2>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-bold text-green-700 whitespace-nowrap">
                    Hammasini o'qish
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 text-2xl leading-none px-1 flex-shrink-0">✕</button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {loading ? (
                <p className="text-center text-gray-400">Yuklanmoqda...</p>
              ) : notifications.length === 0 ? (
                <p className="text-center text-gray-400 mt-10">Hozircha bildirishnoma yo'q.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className="w-full text-left rounded-2xl p-3"
                    style={{
                      backgroundColor: n.read ? "#f9fafb" : "#dcfce7",
                      border: `1px solid ${n.read ? "#e5e7eb" : "#bbf7d0"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm" style={{ color: "#000000" }}>
                        {!n.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-600 mr-1.5 align-middle" />
                        )}
                        {n.title}
                      </p>
                      <p className="text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: "#6b7280" }}>
                        {formatSeoulDateTime(n.created_at)}
                      </p>
                    </div>
                    <p className="text-xs whitespace-pre-line" style={{ color: "#374151" }}>{n.message}</p>
                    {n.push_ok === false && (
                      <p className="text-[11px] mt-1 font-semibold" style={{ color: "#b91c1c" }}>
                        ⚠️ Push qurilmaga yetib bormagan bo'lishi mumkin{n.push_error ? `: ${n.push_error.slice(0, 100)}` : ""}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
