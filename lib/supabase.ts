import { createClient } from "@supabase/supabase-js";

// DIQQAT: "cache: no-store" ataylab qo'shilgan. Aks holda ba'zi
// qurilmalar/tarmoqlar (masalan mobil WebView'ning disk keshi) so'rov
// URL'i bir xil bo'lganda (masalan admin paneldagi "products?...order=id"
// so'rovi) natijani keshlab, ilova to'liq yopib qayta ochilgandan keyin
// ham ESKI ma'lumotni ko'rsatib qolishi mumkin edi — yangi qo'shilgan
// mahsulotlar administratorga darhol ko'rinmasligi shundan edi.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  }
);