import { NextRequest, NextResponse } from "next/server";
import { sendCustomerPush } from "@/lib/onesignal";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Admin panelda buyurtma holati o'zgartirilganda (✅ To'landi / 📦 Jo'natildi /
// ❌ Bekor qilindi) mijozning o'ziga (agar ro'yxatdan o'tgan bo'lsa - userId
// bor bo'lsa) push bildirishnoma yuboradi. REST API kalit shu yerda,
// serverda ishlatiladi - brauzerga chiqmaydi.
const STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
  paid: { title: "✅ To'lovingiz tasdiqlandi", message: "Buyurtmangiz to'lovi tasdiqlandi." },
  shipped: { title: "📦 Buyurtmangiz jo'natildi", message: "Buyurtmangiz yo'lda - tez orada yetib boradi!" },
  cancelled: { title: "❌ Buyurtmangiz bekor qilindi", message: "Afsuski, buyurtmangiz bekor qilindi." },
};

// Yangi buyurtma kelganda qaysi Telegram guruhiga xabar yuborilgan bo'lsa
// (app/api/order/route.ts), xuddi o'sha guruhga - holat o'zgarganda ham
// (To'landi / Jo'natildi / Bekor qilindi) xabar yuborish uchun.
const BOT_TOKEN = "8798311944:AAHUBgMJ4OrKiy8qMUwx9bQFSNRJ-dRBCjg";
const CHAT_ID = "-1004384813041";

const STATUS_TG_TITLE: Record<string, string> = {
  paid: "✅ To'lov tasdiqlandi",
  shipped: "📦 Jo'natildi",
  cancelled: "❌ Bekor qilindi",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, status, userId } = body as {
      orderNumber?: number | string;
      status?: string;
      userId?: string | null;
    };

    if (!status || !STATUS_MESSAGES[status]) {
      return NextResponse.json({ error: "Noto'g'ri status." }, { status: 400 });
    }

    let pushResult: { success: boolean; error?: string } | null = null;
    if (userId) {
      const { title, message } = STATUS_MESSAGES[status];
      pushResult = await sendCustomerPush(`${title} №${orderNumber}`, message, {
        url: `/profile/orders/${orderNumber}`,
        externalUserId: userId,
      });
      if (!pushResult.success) {
        // Buyurtma holati baribir yangilangan bo'lishi kerak - shuning uchun
        // bu yerda xatolikni faqat log qilamiz (Vercel > Deployments > Logs'da
        // ko'rinadi), lekin javobni to'xtatmaymiz.
        console.error("Push yuborilmadi (order/paid):", pushResult.error);
      }
    }

    // Telegram guruhiga ham holat o'zgarishi haqida xabar yuboramiz - bu
    // xatolik bersa ham, buyurtma holati baribir yangilangan bo'lishi kerak,
    // shuning uchun xatolik faqat log qilinadi.
    try {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("customer_name, phone, total")
        .eq("id", orderNumber)
        .maybeSingle();

      const text =
        `${STATUS_TG_TITLE[status] || status}\n\n` +
        `📦 Buyurtma № ${orderNumber}\n` +
        (order?.customer_name ? `👤 Ism: ${order.customer_name}\n` : "") +
        (order?.phone ? `📞 Telefon: ${order.phone}\n` : "") +
        (order?.total != null ? `💰 Jami: ${order.total.toLocaleString()}₩` : "");

      const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
      });
      const tgResult = await tgResponse.json();
      console.log("TELEGRAM JAVOB (status o'zgarishi):", tgResult);
    } catch (e) {
      console.error("Telegramga yuborishda xatolik (order/paid):", e);
    }

    return NextResponse.json({ success: true, pushResult });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
