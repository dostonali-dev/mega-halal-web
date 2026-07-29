import { SolapiMessageService } from "solapi";

// DIQQAT: bu fayl faqat server tomonida (API route'larda) ishlatilishi kerak!
// SOLAPI_API_SECRET hech qachon "NEXT_PUBLIC_" prefiksi bilan yozilmasin va
// client componentlarga import qilinmasin.
const messageService = new SolapiMessageService(
  process.env.SOLAPI_API_KEY!,
  process.env.SOLAPI_API_SECRET!
);

// Telefon raqamini Solapi kutgan formatga keltiradi: faqat raqamlar
// (masalan "010-1234-5678" -> "01012345678").
function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export async function sendSms(phone: string, text: string) {
  const from = process.env.SOLAPI_SENDER_NUMBER;
  if (!from) {
    throw new Error("SOLAPI_SENDER_NUMBER sozlanmagan.");
  }
  await messageService.send({
    to: normalizePhone(phone),
    from: normalizePhone(from),
    text,
  });
}
