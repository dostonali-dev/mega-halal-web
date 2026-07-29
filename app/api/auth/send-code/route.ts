import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSms } from "@/lib/solapi";
import { normalizePhone } from "@/lib/phone";

const CODE_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function isValidPhone(digits: string) {
  return /^01[0-9]\d{7,8}$/.test(digits);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, purpose } = body as { phone?: string; purpose?: "signup" | "reset" };

    if (!phone || !purpose || (purpose !== "signup" && purpose !== "reset")) {
      return NextResponse.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
    }

    const digits = normalizePhone(phone);
    if (!isValidPhone(digits)) {
      return NextResponse.json({ error: "Telefon raqamini to'g'ri kiriting." }, { status: 400 });
    }

    // Ro'yxatdan o'tish uchun: bu raqam bilan hisob bo'lmasligi kerak.
    // Parolni tiklash uchun: bu raqam bilan hisob bo'lishi shart.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", digits)
      .maybeSingle();

    if (purpose === "signup" && existingProfile) {
      return NextResponse.json({ error: "Bu raqam bilan hisob allaqachon mavjud." }, { status: 400 });
    }
    if (purpose === "reset" && !existingProfile) {
      return NextResponse.json({ error: "Bu raqam bilan ro'yxatdan o'tilmagan." }, { status: 400 });
    }

    // Spam/tez-tez so'rashning oldini olish.
    const { data: recent } = await supabaseAdmin
      .from("otp_codes")
      .select("created_at")
      .eq("phone", digits)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const secondsSince = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
      if (secondsSince < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          { error: `Iltimos, ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince)} soniyadan keyin qayta urinib ko'ring.` },
          { status: 429 }
        );
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin.from("otp_codes").insert({
      phone: digits,
      purpose,
      code,
      expires_at: expiresAt,
    });
    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: "Kod yaratishda xatolik." }, { status: 500 });
    }

    try {
      await sendSms(
        digits,
        `[Mega Halal Supermarket] Tasdiqlash kodingiz: ${code}. Kod ${CODE_TTL_MINUTES} daqiqa amal qiladi.`
      );
    } catch (smsError) {
      console.error("SMS yuborishda xatolik:", smsError);
      return NextResponse.json({ error: "SMS yuborishda xatolik yuz berdi." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
