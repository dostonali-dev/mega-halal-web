// DIQQAT: bu fayl faqat server tomonida (API route'larda) ishlatilishi kerak!
//
// Solapi SMS yuborish kaliti uchun doimiy IP manzilini ro'yxatga olish
// MAJBURIY ("barcha IP" ruxsat etilmaydi). Vercel esa doimiy IP bermaydi
// (statik IP faqat Pro/Enterprise rejada, qo'shimcha to'lov evaziga).
// Shu sababli Solapi'ga to'g'ridan-to'g'ri emas, balki doimiy IP'li alohida
// "relay" server orqali murojaat qilamiz (qarang: sms-relay/server.js).
//
// SMS_RELAY_URL hech qachon "NEXT_PUBLIC_" prefiksi bilan yozilmasin va
// client componentlarga import qilinmasin.

// Telefon raqamini Solapi kutgan formatga keltiradi: faqat raqamlar
// (masalan "010-1234-5678" -> "01012345678").
function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export async function sendSms(phone: string, text: string) {
  const relayUrl = process.env.SMS_RELAY_URL;
  const relaySecret = process.env.SMS_RELAY_SECRET;

  if (!relayUrl || !relaySecret) {
    throw new Error("SMS_RELAY_URL yoki SMS_RELAY_SECRET sozlanmagan.");
  }

  const res = await fetch(`${relayUrl.replace(/\/$/, "")}/send-sms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-relay-secret": relaySecret,
    },
    body: JSON.stringify({
      phone: normalizePhone(phone),
      text,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail || data?.error || "";
    } catch {
      // javobni JSON sifatida o'qib bo'lmadi — umumiy xatolik bilan davom etamiz
    }
    throw new Error(detail || `SMS relay xatolik qaytardi: ${res.status}`);
  }
}
