import { NextRequest, NextResponse } from "next/server";
import { sendCustomerPush } from "@/lib/onesignal";

// Admin panelda buyurtma holati o'zgartirilganda (✅ To'landi / 📦 Jo'natildi /
// ❌ Bekor qilindi) mijozning o'ziga (agar ro'yxatdan o'tgan bo'lsa - userId
// bor bo'lsa) push bildirishnoma yuboradi. REST API kalit shu yerda,
// serverda ishlatiladi - brauzerga chiqmaydi.
const STATUS_MESSAGES: Record<string, { title: string; message: string }> = {
  paid: { title: "✅ Buyurtmangiz to'landi", message: "Buyurtmangiz to'lovi tasdiqlandi." },
  shipped: { title: "📦 Buyurtmangiz jo'natildi", message: "Buyurtmangiz yo'lda - tez orada yetib boradi!" },
  cancelled: { title: "❌ Buyurtmangiz bekor qilindi", message: "Afsuski, buyurtmangiz bekor qilindi." },
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

    return NextResponse.json({ success: true, pushResult });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
