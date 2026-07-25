import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, newPassword, adminSecret } = body as {
      userId?: string;
      newPassword?: string;
      adminSecret?: string;
    };

    // Oddiy himoya: shu maxfiy kalit to'g'ri kelmasa, so'rov rad etiladi.
    // (.env.local va Vercel'da ADMIN_API_SECRET o'rnatilgan bo'lishi kerak.)
    if (!process.env.ADMIN_API_SECRET || adminSecret !== process.env.ADMIN_API_SECRET) {
      return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
    }

    if (!userId || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "userId va kamida 4 belgili parol kerak." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
