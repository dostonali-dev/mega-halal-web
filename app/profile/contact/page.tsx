"use client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const STORE_PHONE = "010-2132-2202";
const STORE_TELEGRAM = "https://t.me/megahalalsuppermarket";

export default function ContactPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">{t("back")}</button>
        <h1 className="text-2xl font-bold text-black mb-6">📞 {t("profile_menu_contact")}</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-2">
          <a href={`tel:${STORE_PHONE}`} className="block bg-gray-100 rounded-xl p-3 text-black font-semibold">
            📱 {STORE_PHONE}
          </a>
          <a href={STORE_TELEGRAM} target="_blank" rel="noreferrer" className="block bg-blue-500 text-white rounded-xl p-3 text-center font-semibold">
            ✈️ Telegram
          </a>
        </div>
      </div>
    </main>
  );
}