// Mahsulotning "hajmi" (masalan "1 kg", "500 gr", "2000 gr") ko'rsatish
// matnini hisoblaydi. Eski mahsulotlarda bu ma'lumot ikki ustunga bo'lingan
// edi: gram (son) va weight_unit (birlik, masalan "gr"). Yangi admin
// formasida esa ikkalasi bitta erkin matn maydoniga ("Hajmi") birlashtirilib,
// to'liq qiymat faqat weight_unit ustuniga yoziladi (gram - null).
// Shuning uchun bu yerda ikkala holat ham qo'llab-quvvatlanadi:
// - eski format: gram=2000, weight_unit="gr" -> "2,000 gr"
// - yangi format: gram=null, weight_unit="2000 gr" -> "2000 gr"
export function formatHajmi(gram?: number | null, weightUnit?: string | null): string {
  if (gram != null) {
    return `${gram.toLocaleString()} ${weightUnit || ""}`.trim();
  }
  return (weightUnit || "").trim();
}
