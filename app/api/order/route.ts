import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  console.log("ORDER KELDI", body);

  const BOT_TOKEN = "8798311944:AAHUBgMJ4OrKiy8qMUwx9bQFSNRJ-dRBCjg";
  const CHAT_ID = "90771259";

  const text = `
🛒 YANGI BUYURTMA

${body.order}

💰 Jami: ${body.total}₩
`;

await fetch(
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

  return NextResponse.json({ success: true });
}