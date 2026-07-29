// Telefon raqami bilan bog'liq umumiy yordamchi funksiyalar. Bu fayl ham
// client, ham server tomonida ishlatiladi (maxfiy narsa saqlamaydi).

export function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

// Supabase Auth email/parol asosida ishlaydi, telefon orqali kirish emas.
// Shu sabab har bir telefon raqami ichki "soxta" email'ga aylantiriladi.
export function phoneToEmail(phone: string) {
  return `${normalizePhone(phone)}@megahalal.local`;
}
