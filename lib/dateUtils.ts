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

// Bugungi kun - Koreya (Asia/Seoul) vaqti bo'yicha, "YYYY-MM-DD" ko'rinishida.
export function todaySeoulDateKey(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

// Hisobot uchun: berilgan "YYYY-MM-DD" (Koreya kuni) ning aynan shu kun soat
// 00:00 (Koreya vaqti) ga to'g'ri keladigan UTC ISO vaqtini qaytaradi -
// Supabase so'rovlarida ".gte()"/".lt()" bilan sana oralig'ini filtrlash uchun.
export function seoulDateToUTCISOStart(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00+09:00`).toISOString();
}

// Berilgan "YYYY-MM-DD" (Koreya kuni) ga N kun qo'shib/ayirib, natijani yana
// "YYYY-MM-DD" (Koreya kuni) ko'rinishida qaytaradi.
export function addSeoulDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}
