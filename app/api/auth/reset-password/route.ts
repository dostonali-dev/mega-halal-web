import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSms } from "@/lib/solapi";
import { normalizePhone } from "@/lib/phone";

function generatePassword() {
  // O'qish/yozishga qulay, aralash harf+raqamli 8 belgili vaqtinchalik parol.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, verifyId } = body as { phone?: string; verifyId?: string };

    if (!phone || !verifyId) {
      return NextResponse.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
    }

    const digits = normalizePhone(phone);

    const { data: otpRow } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("id", verifyId)
      .eq("purpose", "reset")
      .eq("phone", digits)
      .eq("verified", true)
      .maybeSingle();

    if (!otpRow || new Date(otpRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Telefon raqami tasdiqlanmagan yoki tasdiqlash muddati tugagan. Qaytadan urinib ko'ring." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", digits)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "Bu raqam bilan hisob topilmadi." }, { status: 400 });
    }

    const newPassword = generatePassword();
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await sendSms(
        digits,
        `[Mega Halal Supermarket] Yangi parolingiz: ${newPassword}. Tizimga shu parol bilan kiring va xohlasangiz profilingizdan o'zgartiring.`
      );
    } catch (smsError) {
      console.error("SMS yuborishda xatolik:", smsError);
      return NextResponse.json({ error: "SMS yuborishda xatolik yuz berdi." }, { status: 500 });
    }

    await supabaseAdmin.from("otp_codes").delete().eq("id", otpRow.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
