"use client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

export default function LanguagePage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">{t("back")}</button>
        <h1 className="text-2xl font-bold text-black mb-6">🌐 {t("profile_menu_language")}</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-2 justify-center py-3 rounded-xl text-sm font-bold border ${
                  language === lang.code ? "bg-green-600 text-white border-green-600" : "bg-white text-black border-gray-200"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}