import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePhone } from "@/lib/phone";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code, purpose } = body as {
      phone?: string;
      code?: string;
      purpose?: "signup" | "reset";
    };

    if (!phone || !code || !purpose) {
      return NextResponse.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
    }

    const digits = normalizePhone(phone);

    const { data: row, error } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("phone", digits)
      .eq("purpose", purpose)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ error: "Kod topilmadi, qaytadan so'rang." }, { status: 400 });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Kodning muddati tugagan, qaytadan so'rang." }, { status: 400 });
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Urinishlar soni tugadi, qaytadan kod so'rang." }, { status: 400 });
    }

    if (row.code !== code.trim()) {
      await supabaseAdmin.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return NextResponse.json({ error: "Kod noto'g'ri." }, { status: 400 });
    }

    await supabaseAdmin.from("otp_codes").update({ verified: true }).eq("id", row.id);

    return NextResponse.json({ success: true, verifyId: row.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Kutilmagan xatolik." }, { status: 500 });
  }
}
