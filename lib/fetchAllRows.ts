import { supabase } from "@/lib/supabase";

// Supabase/PostgREST standart holatda bitta so'rovda faqat 1000 tagacha
// qator qaytaradi. Mahsulotlar soni 1000 dan oshib ketgach, oddiy
// `.select("*")` katalogning yarmigina qaytarib qolgan edi — va qaysi
// qismi qaytishi so'rovga (tartiblashga) bog'liq bo'lgani uchun, mijoz
// ilovasi va admin panel turli mahsulotlarni "yo'qotib" qo'yardi (masalan
// "Diniy bo'lim" mijozda ko'rinib, admin panelda ko'rinmasdi).
//
// Bu funksiya jadvaldagi BARCHA qatorlarni 1000 tadan sahifalab yuklab,
// birlashtirib qaytaradi — shu orqali hech bir mahsulot tushib qolmaydi.
export async function fetchAllRows<T = any>(
  table: string,
  orderColumn = "id",
  ascending = false
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let all: T[] = [];
  let from = 0;
  // Xavfsizlik uchun cheksiz aylanmasin deb yuqori chegara qo'yamiz
  // (1000 marta * 1000 tadan = 1 million qatorgacha yetadi).
  for (let i = 0; i < 1000; i++) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all = all.concat((data as T[]) || []);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}
