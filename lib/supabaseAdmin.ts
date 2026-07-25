import { createClient } from "@supabase/supabase-js";

// DIQQAT: bu fayl faqat server tomonida (API route'larda) ishlatilishi kerak!
// SUPABASE_SERVICE_ROLE_KEY hech qachon "NEXT_PUBLIC_" prefiksi bilan
// yozilmasin va client componentlarga import qilinmasin — aks holda
// bu maxfiy kalit brauzerga chiqib ketadi va butun bazangizga to'liq
// (RLS'ni chetlab o'tuvchi) kirish huquqi ochilib qoladi.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
