"use client";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

const STORE_PHONE = "010-2132-2202";
const STORE_PHONE_2 = "010-2667-9777";
const STORE_TELEGRAM = "https://t.me/megahalalsuppermarket";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`📞 ${t("profile_menu_contact")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-2">
          <a href={`tel:${STORE_PHONE}`} className="block bg-gray-100 rounded-xl p-3 text-black font-semibold">
            📱 {STORE_PHONE}
          </a>
          <a href={`tel:${STORE_PHONE_2}`} className="block bg-gray-100 rounded-xl p-3 text-black font-semibold">
            📱 {STORE_PHONE_2}
          </a>
          <a href={STORE_TELEGRAM} target="_blank" rel="noreferrer" className="block bg-blue-500 text-white rounded-xl p-3 text-center font-semibold">
            ✈️ Telegram
          </a>
        </div>
      </div>
    </main>
  );
}