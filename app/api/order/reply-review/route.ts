import { NextRequest, NextResponse } from "next/server";
import { sendCustomerPush } from "@/lib/onesignal";

// Admin mijozning buyurtmaga yozgan baho-izohiga javob yozganda, mijozning
// o'ziga (agar ro'yxatdan o'tgan bo'lsa) push bildirishnoma yuboriladi.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, userId, reply } = body as {
      orderId?: number | string;
      userId?: string | null;
      reply?: string;
    };

    if (!orderId || !reply) {
      return NextResponse.json({ error: "orderId va reply kerak." }, { status: 400 });
    }

    if (userId) {
      await sendCustomerPush("💬 Buyurtmangizga javob keldi", reply, {
        url: `/profile/orders/${orderId}`,
        externalUserId: userId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
