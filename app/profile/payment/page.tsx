"use client";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

// Hozircha to'lov kartasini xavfsiz saqlash uchun infratuzilma (PCI-compliant
// karta saqlash xizmati) ulanmagan - shu sababli bu yerda karta raqamlarini
// to'g'ridan-to'g'ri bazaga yozmaymiz (bu xavfsiz emas). Hozircha "tez orada"
// ekrani, checkout jarayoni hozirgidek bank o'tkazmasi + chek rasmi orqali davom etadi.
export default function PaymentPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`💳 ${t("payment_card_title")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-6 text-center">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-black font-semibold mb-1">{t("payment_card_empty")}</p>
          <p className="text-gray-400 text-sm">Hozircha buyurtmalar bank o'tkazmasi orqali qabul qilinadi. Karta orqali to'lov tez orada qo'shiladi.</p>
        </div>
      </div>
    </main>
  );
}
