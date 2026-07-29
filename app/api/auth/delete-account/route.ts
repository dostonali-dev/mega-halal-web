import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken } = body as { accessToken?: string };
    if (!accessToken) {
      return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
    }

    // Kim so'rov yuborayotganini token orqali serverda tekshiramiz — client
    // tomondan kelgan userId'ga ishonib bo'lmaydi, faqat token orqali
    // tasdiqlangan foydalanuvchini o'chiramiz.
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Ruxsat yo'q." }, { status: 401 });
    }
    const userId = userData.user.id;

    await supabaseAdmin.from("addresses").delete().eq("user_id", userId);
    await supabaseAdmin.from("favorites").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    // Buyurtmalar tarixi (orders) ataylab o'chirilmaydi — biznes/hisobot
    // maqsadida saqlanib qoladi, faqat endi hech qanday faol hisobga
    // bog'lanmagan bo'ladi.

    // Eng muhimi: haqiqiy auth hisobini ham to'liq o'chiramiz (buni faqat
    // service role bilan, ya'ni shu server tomonida qilish mumkin) — aks
    // holda "etim" hisob qolib, keyinchalik shu raqam bilan qayta ro'yxatdan
    // o'tilganda eski identifikator qayta jonlanib, eski ma'lumotlar
    // (masalan buyurtmalar) yangi hisobda ko'rinib qolaveradi.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
