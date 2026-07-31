"use client";
import { useLanguage } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";

export default function LanguagePage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`🌐 ${t("profile_menu_language")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
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