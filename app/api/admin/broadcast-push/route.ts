import { NextRequest, NextResponse } from "next/server";
import { sendCustomerPush } from "@/lib/onesignal";

// Admin panelidagi "Push xabar" sahifasidan barcha mijozlarga (ilovani
// o'rnatgan har bir odamga) push bildirishnoma yuborish uchun.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, message, url } = body as { title?: string; message?: string; url?: string };

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Sarlavha va matn kerak." }, { status: 400 });
    }

    await sendCustomerPush(title.trim(), message.trim(), { url: url?.trim() || undefined });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
