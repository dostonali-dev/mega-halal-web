import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const {
  order,
  total,
  customerName,
  phone,
  address,
  note,
  orderNumber,
} = body;

  const BOT_TOKEN = "8798311944:AAHUBgMJ4OrKiy8qMUwx9bQFSNRJ-dRBCjg";
  const CHAT_ID = "90771259";

  const text = `
🛒 Yangi buyurtma

📦 Buyurtma № ${orderNumber}

👤 Ism: ${customerName}
📞 Telefon: ${phone}
📍 Manzil: ${address}

${order}

💰 Jami: ${total}₩
`;

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
      }),
    }
  );

  const result = await response.json();
  console.log("TELEGRAM JAVOB:", result);

  return NextResponse.json({
    success: true,
  });
}