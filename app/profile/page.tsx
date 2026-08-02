"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function ProfilePage() {
  const { user, guestMode, exitGuest } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { href: "/profile/notifications", icon: "🔔", label: "Bildirishnomalar" },
    { href: "/recently-viewed", icon: "🕓", label: t("profile_menu_recently_viewed") },
    { href: "/favorites", icon: "❤️", label: t("profile_menu_favorites") },
    { href: "/profile/orders", icon: "🧾", label: t("profile_menu_orders") },
    { href: "/profile/best-selling", icon: "🛒", label: t("profile_menu_best_selling") },
    { href: "/profile/contact", icon: "📞", label: t("profile_menu_contact") },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">👤 {t("profile_title")}</h1>

        {guestMode && !user && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-3"
            style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#a16207" }}>{t("guest_banner_text")}</p>
            <button onClick={exitGuest} className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap">
              {t("guest_banner_button")}
            </button>
          </div>
        )}

        <div className="bg-white border border-green-100 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-black truncate">{user?.name}</p>
              <p className="text-gray-500">{user?.phone}</p>
            </div>
            <Link
              href="/profile/account"
              aria-label={t("profile_menu_my_account")}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#f3f4f6" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl overflow-hidden mb-6">
          {menuItems.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-4 ${i !== menuItems.length - 1 ? "border-b" : ""}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="flex-1 font-semibold text-black">{item.label}</span>
              <span className="text-gray-300">→</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 pb-6 text-center">
          <div className="inline-flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-400 tracking-wide">👨‍💻 Developer</p>
            <p className="text-sm font-bold text-gray-600">Doston Ali-dev</p>
            <p className="text-xs text-gray-400">dostonalibek@gmail.com</p>
          </div>
        </div>
      </div>
    </main>
  );
}