"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

// "Mening akkountim" - ism, telefon, parol, manzillar, to'lov kartasi, til,
// chiqish va akkauntni o'chirish shu bir joyda jamlangan.
export default function MyAccountPage() {
  const router = useRouter();
  const { user, guestMode, signOut, exitGuest, updateName } = useAuth();
  const { t } = useLanguage();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    setSavingName(true);
    await updateName(nameValue);
    setSavingName(false);
    setEditingName(false);
  };

  const menuItems = [
    { href: "/profile/phone", icon: "📱", label: t("my_account_phone") },
    { href: "/profile/password", icon: "🔒", label: t("my_account_password") },
    { href: "/profile/addresses", icon: "📍", label: t("my_account_addresses") },
    { href: "/profile/payment", icon: "💳", label: t("my_account_payment") },
    { href: "/profile/language", icon: "🌐", label: t("my_account_language") },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-10">
      <PageHeader title={`👤 ${t("my_account_title")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-gray-400 mb-1.5">{t("my_account_name")}</p>
          {editingName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="flex-1 border rounded-xl p-2.5 text-black"
              />
              <button onClick={handleSaveName} disabled={savingName} className="bg-green-600 text-white px-4 rounded-xl font-bold text-sm">
                {savingName ? "..." : t("address_save")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-black font-semibold text-lg">{user?.name}</p>
              <button onClick={() => { setNameValue(user?.name || ""); setEditingName(true); }} className="text-blue-600 text-xs font-bold underline">
                Tahrirlash
              </button>
            </div>
          )}
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
          <button
            onClick={async () => {
              if (guestMode && !user) exitGuest();
              else await signOut();
              router.push("/");
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold"
          >
            {t("my_account_logout")}
          </button>
          {!guestMode && (
            <Link href="/profile/delete" className="block text-center text-gray-400 text-sm underline">
              {t("my_account_delete")}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
