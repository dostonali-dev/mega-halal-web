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
    let userId: string | null = null;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !created.user) {
      // Ilgari (masalan, sinov paytida yoki muvaffaqiyatsiz urinishdan keyin)
      // shu email bilan "etim" auth hisobi qolib ketgan bo'lishi mumkin —
      // profili yo'q, lekin auth tizimida mavjud. Shunday holatni topib,
      // uni shu ma'lumotlar bilan qayta ishga tushiramiz (parolni yangilab,
      // profilini yaratamiz), xatolik chiqarish o'rniga.
      const isAlreadyRegistered = /already|registered|exists/i.test(createError?.message || "");
      if (isAlreadyRegistered) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const orphan = list?.users.find((u) => u.email === email);
        if (orphan) {
          const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(orphan.id, { password });
          if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 });
          userId = orphan.id;
        }
      }
      if (!userId) {
        return NextResponse.json(
          { error: createError?.message || "Ro'yxatdan o'tishda xatolik." },
          { status: 500 }
        );
      }
    } else {
      userId = created.user.id;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, name: name.trim(), phone: digits }, { onConflict: "id" });
    if (profileError) {
      // Yangi yaratilgan (etim bo'lmagan) foydalanuvchida profil saqlanmasa,
      // auth hisobini ham bekor qilamiz — aks holda "profilsiz" hisob qolib ketadi.
      if (created?.user) await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await supabaseAdmin.from("otp_codes").delete().eq("id", otpRow.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
