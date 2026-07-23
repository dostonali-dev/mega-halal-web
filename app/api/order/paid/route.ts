import { NextResponse } from "next/server";

const BOT_TOKEN = "8798311944:AAHUBgMJ4OrKiy8qMUwx9bQFSNRJ-dRBCjg";
const CHAT_ID = "-1004384813041";

const MESSAGES: Record<string, (orderNumber: string | number) => string> = {
  paid: (orderNumber) => `✅ To'lov muvaffaqiyatli qabul qilindi!

📦 Buyurtma № ${orderNumber}

🚚 Buyurtmani jo'natish uchun ruxsat!`,
  shipped: (orderNumber) => `📦 Buyurtma jo'natildi!

📦 Buyurtma № ${orderNumber}

🚚 Mijozga yetkazib berilmoqda.`,
  cancelled: (orderNumber) => `❌ Buyurtma bekor qilindi!

📦 Buyurtma № ${orderNumber}`,
};

export async function POST(req: Request) {
  const { orderNumber, status } = await req.json();

  const buildText = MESSAGES[status] || MESSAGES.paid;
  const text = buildText(orderNumber);

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
      }),
    }
  );

  const result = await response.json();
  console.log("TELEGRAM STATUS JAVOB:", result);

  return NextResponse.json({ success: true });
}