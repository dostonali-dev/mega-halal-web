"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatSeoulDateTime } from "@/lib/dateUtils";
import PageHeader from "@/components/PageHeader";

type Notification = {
  id: number;
  title: string;
  message: string;
  url: string | null;
  target_user_id: string | null;
  created_at: string;
};

// Admin tomonidan yuborilgan push bildirishnomalar ro'yxati - "customer_notifications"
// jadvalidan o'qiladi (lib/onesignal.ts'dagi sendCustomerPush har safar push
// yuborilganda shu jadvalga yozadi). target_user_id bo'sh bo'lsa - bu barcha
// mijozlarga umumiy e'lon, aks holda faqat o'sha foydalanuvchiga tegishli
// (masalan buyurtma holati o'zgarishi yoki izohga javob).
export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const query = supabase
        .from("customer_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      const { data, error } = user
        ? await query.or(`target_user_id.is.null,target_user_id.eq.${user.id}`)
        : await query.is("target_user_id", null);

      if (!error && data) setNotifications(data);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title="🔔 Bildirishnomalar" />
      <div className="max-w-md mx-auto p-4 md:p-8">
        {loading ? (
          <p className="text-center text-gray-400">Yuklanmoqda...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">Hozircha bildirishnoma yo'q.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const card = (
                <div className="rounded-2xl p-4" style={{ backgroundColor: "#dcfce7", border: "1px solid #bbf7d0" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold" style={{ color: "#000000" }}>{n.title}</p>
                    <p className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: "#4b5563" }}>
                      {formatSeoulDateTime(n.created_at)}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-line" style={{ color: "#1f2937" }}>{n.message}</p>
                </div>
              );
              return n.url ? (
                <Link key={n.id} href={n.url} className="block">
                  {card}
                </Link>
              ) : (
                <div key={n.id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
