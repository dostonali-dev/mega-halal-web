// Mega Halal Supermarket — Solapi SMS relay server.
//
// Nima uchun kerak: Solapi SMS yuborish huquqi bo'lgan kalit uchun doimiy,
// aniq IP manzilini ro'yxatga olishni MAJBURIY talab qiladi ("barcha IP"
// ruxsat etilmaydi). Vercel esa (Hobby/Pro rejada statik IP xizmatisiz)
// har safar boshqa IP'dan so'rov yuboradi. Shu sababli Solapi'ga
// to'g'ridan-to'g'ri Vercel'dan emas, balki shu doimiy IP'li kichik
// server orqali murojaat qilamiz:
//
//   Vercel (app/api/auth/send-code) --> shu relay server --> Solapi
//
// Bu serverni biror doimiy/statik IP'li joyga (masalan Oracle Cloud Free
// Tier virtual mashinasiga) joylashtirish kerak.

require("dotenv").config();
const express = require("express");
const { SolapiMessageService } = require("solapi");

const PORT = process.env.PORT || 8080;
const RELAY_SECRET = process.env.RELAY_SECRET;
const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const SOLAPI_SENDER_NUMBER = process.env.SOLAPI_SENDER_NUMBER;

if (!RELAY_SECRET || !SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER_NUMBER) {
  console.error(
    "XATOLIK: RELAY_SECRET, SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER_NUMBER " +
      "environment o'zgaruvchilari to'liq sozlanmagan. Serverni to'xtatyapman."
  );
  process.exit(1);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/[^0-9]/g, "");
}

const messageService = new SolapiMessageService(SOLAPI_API_KEY, SOLAPI_API_SECRET);

const app = express();
app.use(express.json());

// Oddiy "tirikmi?" tekshiruvi — brauzerda ochib ko'rish uchun ham qulay.
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/send-sms", async (req, res) => {
  // Faqat to'g'ri maxfiy kalit bilan kelgan so'rovlarni qabul qilamiz —
  // aks holda istalgan kishi shu server orqali bepul SMS yubora oladi.
  const providedSecret = req.get("x-relay-secret");
  if (!providedSecret || providedSecret !== RELAY_SECRET) {
    return res.status(401).json({ error: "Ruxsat etilmagan so'rov." });
  }

  const { phone, text } = req.body || {};
  if (!phone || !text) {
    return res.status(400).json({ error: "phone va text maydonlari majburiy." });
  }

  try {
    await messageService.send({
      to: normalizePhone(phone),
      from: normalizePhone(SOLAPI_SENDER_NUMBER),
      text,
    });
    return res.json({ success: true });
  } catch (smsError) {
    console.error("Solapi orqali SMS yuborishda xatolik:", smsError);
    const detail =
      smsError?.response?.data?.errorMessage ||
      smsError?.errorMessage ||
      smsError?.message ||
      (typeof smsError === "string" ? smsError : "");
    return res.status(500).json({ error: "SMS yuborishda xatolik yuz berdi.", detail });
  }
});

app.listen(PORT, () => {
  console.log(`SMS relay server ${PORT}-portda ishga tushdi.`);
});
