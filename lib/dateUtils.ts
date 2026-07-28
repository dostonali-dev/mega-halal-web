// Supabase ba'zan sanani "timestamp without time zone" ko'rinishida qaytaradi —
// bunda qiymat oxirida "Z" belgisi bo'lmaydi va brauzer uni UTC emas, balki
// qurilmaning mahalliy vaqti sifatida o'qib, buyurtma vaqtini haqiqiy vaqtdan
// bir necha soatga siljitib ko'rsatadi. Quyidagi funksiyalar bu qiymatni har doim
// to'g'ri UTC sifatida o'qiydi, so'ng aniq Koreya (Asia/Seoul) vaqtiga o'giradi —
// admin qaysi davlatdan kirmasin, buyurtma vaqti har doim Koreya vaqti bilan mos keladi.

export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasTZ = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const normalized = hasTZ ? value : `${value.replace(" ", "T")}Z`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export function formatSeoulDateTime(value: string | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "—";
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function formatSeoulDate(value: string | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

export function formatSeoulTime(value: string | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "—";
  return d.toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" });
}

// Kunlar bo'yicha guruhlash uchun barqaror "YYYY-MM-DD" kalit (Asia/Seoul kuni bo'yicha)
export function seoulDateKey(value: string | null | undefined): string {
  const d = parseServerDate(value);
  if (!d) return "unknown";
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
