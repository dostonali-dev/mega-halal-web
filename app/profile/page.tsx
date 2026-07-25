"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function ProfilePage() {
  const { user, signOut, guestMode, exitGuest } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { href: "/profile/password", icon: "🔒", label: t("profile_menu_password") },
    { href: "/profile/phone", icon: "📱", label: t("profile_menu_phone") },
    { href: "/profile/language", icon: "🌐", label: t("profile_menu_language") },
    { href: "/profile/addresses", icon: "📍", label: t("profile_menu_addresses") },
    { href: "/profile/contact", icon: "📞", label: t("profile_menu_contact") },
    { href: "/profile/orders", icon: "🧾", label: t("profile_menu_orders") },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">👤 {t("profile_title")}</h1>

        {guestMode && !user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-yellow-700">{t("guest_banner_text")}</p>
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
            <div>
              <p className="text-lg font-bold text-black">{user?.name}</p>
              <p className="text-gray-500">{user?.phone}</p>
            </div>
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

        <div className="space-y-3">
          <button onClick={guestMode && !user ? exitGuest : signOut} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold">
            {t("profile_menu_signout")}
          </button>
          {!guestMode && (
            <Link href="/profile/delete" className="block text-center text-gray-400 text-sm underline">
              {t("profile_menu_delete_account")}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}