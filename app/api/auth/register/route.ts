import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePhone, phoneToEmail } from "@/lib/phone";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, password, verifyId } = body as {
      name?: string;
      phone?: string;
      password?: string;
      verifyId?: string;
    };

    if (!name?.trim() || !phone || !password || password.length < 4 || !verifyId) {
      return NextResponse.json({ error: "Barcha maydonlarni to'g'ri to'ldiring." }, { status: 400 });
    }

    const digits = normalizePhone(phone);

    const { data: otpRow } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("id", verifyId)
      .eq("purpose", "signup")
      .eq("phone", digits)
      .eq("verified", true)
      .maybeSingle();

    if (!otpRow || new Date(otpRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Telefon raqami tasdiqlanmagan yoki tasdiqlash muddati tugagan. Qaytadan urinib ko'ring." },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", digits)
      .maybeSingle();
    if (existingProfile) {
      return NextResponse.json({ error: "Bu raqam bilan hisob allaqachon mavjud." }, { status: 400 });
    }

    const email = phoneToEmail(digits);
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || "Ro'yxatdan o'tishda xatolik." }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      name: name.trim(),
      phone: digits,
    });
    if (profileError) {
      // Profil yaratilmasa, yaratilgan auth foydalanuvchisini ham bekor qilamiz —
      // aks holda "profilsiz" hisob qolib ketadi.
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await supabaseAdmin.from("otp_codes").delete().eq("id", otpRow.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
