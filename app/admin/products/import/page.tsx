"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Excel (.xlsx/.xls/.csv) fayldan mahsulotlarni ommaviy import qilish.
// Qaysi kategoriyaga tushishini o'zingiz tanlaysiz (mavjudlaridan birini
// tanlashingiz yoki yangisini yozishingiz mumkin — kategoriya bazada yo'q
// bo'lsa, avtomatik yaratiladi). Fayldagi ustunlar turlicha nomlangan
// bo'lishi mumkin (masalan koreyscha "원산지", "판매가"), shuning uchun
// foydalanuvchi har bir maydonni qaysi ustunga mos kelishini o'zi tanlaydi.
// Eski (.xls) fayllarda ba'zan kodировка noto'g'ri aniqlanib, koreyscha
// matn tushunarsiz belgilarga aylanib qoladi — shu holatni avtomatik
// tuzatishga harakat qilamiz, tuzatilmasa ham har bir ustun tagida
// haqiqiy misol qiymat ko'rsatiladi (shu orqali ustunni tanish mumkin).

type Category = { id: number; name: string };

type FieldKey = "name" | "price" | "description" | "image" | "stock" | "productCode" | "keywords" | "supplier";

const FIELD_DEFS: { key: FieldKey; label: string; required?: boolean; hint?: string }[] = [
  { key: "name", label: "Mahsulot nomi", required: true },
  { key: "price", label: "Narxi", required: true },
  { key: "description", label: "Tavsif (masalan, 원산지 ustuni)", hint: "Bu ustundagi matn mahsulot tavsifiga yoziladi" },
  { key: "image", label: "Rasm URL", hint: "Faylda tayyor rasm havolasi bo'lsa" },
  { key: "stock", label: "Soni (ombordagi miqdor)" },
  { key: "productCode", label: "Mahsulot kodi / barkod" },
  { key: "supplier", label: "Firma / yetkazib beruvchi", hint: "Faqat siz ko'rasiz, mijozga ko'rinmaydi (masalan 공급사 ustuni)" },
  { key: "keywords", label: "Kalit so'zlar" },
];

// Ba'zi fayllarning oxirida "Jami / O'rtacha" kabi statistik qatorlar
// bo'ladi — bular haqiqiy mahsulot emas, import paytida avtomatik o'tkazib
// yuboriladi.
const SKIP_NAME_PATTERNS = ["합계", "총계", "평균", "표준편차", "total", "subtotal", "jami", "o'rtacha", "average"];

function parsePrice(raw: any): number {
  const s = String(raw ?? "").replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// Ba'zi eski .xls fayllarda kodировка (masalan koreyscha CP949/EUC-KR)
// noto'g'ri aniqlanib, matn tushunarsiz lotin belgilariga aylanib qoladi
// (masalan "상품명" o'rniga "»óÇ°¸í"). Bu funksiya shunday holatni
// tuzatishga harakat qiladi: har bir belgini bitta bayt deb hisoblab,
// EUC-KR sifatida qayta o'qiydi, va agar natijada haqiqiy koreyscha
// harflar paydo bo'lsa, o'shani qaytaradi.
function fixMojibake(s: string): string {
  if (!s) return s;
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code > 0xff) return s; // allaqachon haqiqiy unicode belgilar bor - tegmaymiz
      bytes[i] = code;
    }
    const decoded = new TextDecoder("euc-kr").decode(bytes);
    if (/[가-힣]/.test(decoded) && !/[가-힣]/.test(s)) return decoded;
  } catch {}
  return s;
}

function cellToStr(v: any): string {
  return fixMojibake(String(v ?? "").trim());
}

export default function ImportProductsPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const targetCategory = addingNewCategory ? newCategoryName : selectedCategory;

  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  // Har bir maydon uchun ustun INDEXI saqlanadi (matn emas) — chunki
  // ba'zi fayllarda ustun sarlavhalari bo'sh yoki bir xil bo'lib chiqishi
  // mumkin, shu sabab matn bo'yicha moslashtirish xato bo'lishi mumkin edi.
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    name: "", price: "", description: "", image: "", stock: "", productCode: "", keywords: "", supplier: "",
  });
  const [parsing, setParsing] = useState(false);
  const [existingCount, setExistingCount] = useState<number | null>(null);
  const [deleteExisting, setDeleteExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState("");
  const [resultMsg, setResultMsg] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  useEffect(() => {
    if (!checkedLogin) return;
    supabase.from("categories").select("id, name").order("name").then(({ data }) => {
      if (data) setCategoriesList(data);
    });
  }, [checkedLogin]);

  useEffect(() => {
    if (!checkedLogin || !targetCategory.trim()) {
      setExistingCount(null);
      return;
    }
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", targetCategory.trim())
      .then(({ count }) => setExistingCount(count ?? 0));
  }, [checkedLogin, targetCategory]);

  const handleFile = async (file: File) => {
    setParsing(true);
    setResultMsg("");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const hdrs = (raw[0] || []).map((h) => fixMojibake(String(h).trim()));
      const dataRows = raw.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ""));
      setHeaders(hdrs);
      setRows(dataRows);
      setFileName(file.name);

      // Ustun nomlariga qarab avtomatik mos kelishini taxmin qilishga urinib ko'ramiz.
      const guess = (candidates: string[]) => {
        const idx = hdrs.findIndex((h) => candidates.some((c) => h.toLowerCase().includes(c.toLowerCase())));
        return idx >= 0 ? String(idx) : "";
      };
      setMapping({
        name: guess(["nomi", "name", "상품명", "제품명", "품명"]),
        price: guess(["narx", "price", "판매가", "가격", "단가"]),
        description: guess(["원산지", "tavsif", "description", "origin"]),
        image: guess(["rasm", "image", "이미지", "사진"]),
        stock: guess(["soni", "stock", "수량", "재고"]),
        productCode: guess(["kod", "barkod", "barcode", "code", "바코드", "코드"]),
        supplier: guess(["firma", "yetkazib", "supplier", "공급사", "제조사"]),
        keywords: guess(["kalit", "keyword", "키워드"]),
      });
    } catch (e: any) {
      console.error(e);
      alert("Faylni o'qib bo'lmadi: " + (e?.message || e));
    }
    setParsing(false);
  };

  const colIndex = (field: FieldKey) => (mapping[field] === "" ? -1 : Number(mapping[field]));

  // Har bir ustun uchun birinchi bo'sh bo'lmagan namuna qiymatini topamiz —
  // sarlavha tushunarsiz bo'lib chiqsa ham, ustunni misol orqali tanish mumkin.
  const sampleFor = (colIdx: number): string => {
    for (const r of rows) {
      const v = cellToStr(r[colIdx]);
      if (v) return v;
    }
    return "";
  };

  const validRows = () => {
    const nameIdx = colIndex("name");
    return rows.filter((r) => {
      const name = cellToStr(r[nameIdx]);
      if (!name) return false;
      const lower = name.toLowerCase();
      return !SKIP_NAME_PATTERNS.some((p) => lower === p.toLowerCase() || lower.includes(p.toLowerCase()));
    });
  };

  const handleImport = async () => {
    const category = targetCategory.trim();
    if (!category) {
      alert("Qaysi kategoriyaga qo'shishni tanlang yoki yozing.");
      return;
    }
    if (mapping.name === "" || mapping.price === "") {
      alert("Kamida \"Mahsulot nomi\" va \"Narxi\" ustunlarini tanlang.");
      return;
    }
    const goodRows = validRows();
    if (goodRows.length === 0) {
      alert("Import qilinadigan qator topilmadi.");
      return;
    }
    const skipped = rows.length - goodRows.length;
    if (
      !confirm(
        `${goodRows.length} ta mahsulot "${category}" kategoriyasiga import qilinsinmi?` +
        (skipped > 0 ? `\n(${skipped} ta qator - masalan jami/o'rtacha qatori - o'tkazib yuborildi)` : "")
      )
    ) return;

    setImporting(true);
    setResultMsg("");
    try {
      // 1) Tanlangan kategoriya mavjudligini tekshirish, bo'lmasa yaratish.
      const { data: existingCat } = await supabase.from("categories").select("id").eq("name", category).maybeSingle();
      if (!existingCat) {
        await supabase.from("categories").insert({ name: category, icon: "📦" });
      }

      // 2) Kerak bo'lsa, shu kategoriyadagi eski mahsulotlarni o'chirish.
      if (deleteExisting) {
        setProgress("Eski mahsulotlar o'chirilmoqda...");
        const { error: delError } = await supabase.from("products").delete().eq("category", category);
        if (delError) throw delError;
      }

      // 3) Qatorlarni mahsulot obyektlariga aylantirish.
      const nameIdx = colIndex("name");
      const priceIdx = colIndex("price");
      const descIdx = colIndex("description");
      const imageIdx = colIndex("image");
      const stockIdx = colIndex("stock");
      const codeIdx = colIndex("productCode");
      const supplierIdx = colIndex("supplier");
      const kwIdx = colIndex("keywords");

      const products = goodRows.map((r) => ({
        name: cellToStr(r[nameIdx]),
        price: parsePrice(r[priceIdx]),
        category,
        description: descIdx >= 0 ? cellToStr(r[descIdx]) || null : null,
        image: imageIdx >= 0 ? cellToStr(r[imageIdx]) || null : null,
        stock: stockIdx >= 0 && cellToStr(r[stockIdx]) !== "" ? Number(cellToStr(r[stockIdx]).replace(/[^\d.-]/g, "")) : null,
        product_code: codeIdx >= 0 ? cellToStr(r[codeIdx]) || null : null,
        supplier: supplierIdx >= 0 ? cellToStr(r[supplierIdx]) || null : null,
        keywords: kwIdx >= 0 ? cellToStr(r[kwIdx]) || null : null,
        in_stock: true,
      }));

      // 4) Katta bo'lsa, bo'lib-bo'lib (200 tadan) qo'shamiz.
      const CHUNK = 200;
      let inserted = 0;
      for (let i = 0; i < products.length; i += CHUNK) {
        const chunk = products.slice(i, i + CHUNK);
        setProgress(`Import qilinmoqda... ${inserted}/${products.length}`);
        const { error } = await supabase.from("products").insert(chunk);
        if (error) {
          if (error.message.includes("keywords")) {
            throw new Error(
              error.message +
              "\n\nBazangizda \"keywords\" ustuni yo'q. Avval Supabase SQL Editor'da quyidagini ishga tushiring:\nALTER TABLE products ADD COLUMN IF NOT EXISTS keywords text;"
            );
          }
          throw error;
        }
        inserted += chunk.length;
      }

      setProgress("");
      setResultMsg(`✅ ${inserted} ta mahsulot "${category}" kategoriyasiga muvaffaqiyatli qo'shildi.`);
      setRows([]);
      setHeaders([]);
      setFileName("");
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category", category);
      setExistingCount(count ?? 0);
    } catch (e: any) {
      console.error(e);
      alert("Import xatoligi: " + (e?.message || e));
      setProgress("");
    }
    setImporting(false);
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <Link href="/admin/products" className="text-green-700 font-semibold">← Mahsulotlar</Link>
      <h1 className="text-3xl font-bold mt-3 mb-1">📥 Excel'dan import qilish</h1>
      <p className="text-gray-500 text-sm mb-6">Excel faylni yuklang va qaysi kategoriyaga qo'shishni tanlang.</p>

      <div className="max-w-xl space-y-4">
        <div className="bg-white border rounded-xl p-4">
          <label className="text-xs font-bold text-gray-600">Qaysi kategoriyaga qo'shilsin? <span className="text-red-500">*</span></label>
          {!addingNewCategory ? (
            <select
              value={selectedCategory}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingNewCategory(true);
                  setSelectedCategory("");
                } else {
                  setSelectedCategory(e.target.value);
                }
              }}
              className="w-full border p-3 rounded-xl bg-white text-black mt-1"
            >
              <option value="">— kategoriyani tanlang —</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="__new__">➕ Yangi kategoriya qo'shish</option>
            </select>
          ) : (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                autoFocus
                placeholder="Yangi kategoriya nomi"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 border p-3 rounded-xl bg-white text-black"
              />
              <button
                onClick={() => { setAddingNewCategory(false); setNewCategoryName(""); }}
                className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
              >
                Bekor
              </button>
            </div>
          )}
          <p className="text-[11px] text-gray-400 mt-1 px-1">
            {addingNewCategory
              ? "Bu nom bazangizda yo'q — import paytida avtomatik yaratiladi."
              : "Mavjud kategoriyalar ro'yxatidan tanlang, yoki \"➕ Yangi kategoriya qo'shish\"ni tanlab yangi nom kiriting."}
          </p>
          {targetCategory.trim() && existingCount !== null && (
            <div className="rounded-lg p-2 text-xs mt-2" style={{ backgroundColor: "#fef9c3", color: "#a16207" }}>
              Hozirda <b>"{targetCategory.trim()}"</b> kategoriyasida <b>{existingCount}</b> ta mahsulot bor.
            </div>
          )}
        </div>

        <div className="border-2 border-dashed rounded-xl p-4 text-center bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">📄 Excel yoki CSV faylni tanlang</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="w-full text-black"
          />
          {parsing && <p className="text-xs text-gray-400 mt-2">O'qilmoqda...</p>}
          {fileName && !parsing && (
            <p className="text-xs text-green-700 mt-2 font-bold">✅ {fileName} — {rows.length} ta qator topildi</p>
          )}
        </div>

        {headers.length > 0 && (
          <div className="bg-white border rounded-xl p-4 space-y-3">
            <h2 className="font-bold text-black">Ustunlarni moslashtirish</h2>
            <p className="text-xs text-gray-500">
              Har bir maydon uchun mos ustunni tanlang. Sarlavha tushunarsiz chiqsa ham, qavs ichidagi misol qiymatga qarab ustunni tanishingiz mumkin.
            </p>
            {FIELD_DEFS.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={mapping[f.key]}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                  className="w-full border p-2 rounded-lg bg-white text-black text-sm mt-1"
                >
                  <option value="">— tanlanmagan —</option>
                  {headers.map((h, idx) => {
                    const sample = sampleFor(idx);
                    const label = h && !/^[^\wㄱ-힝]*$/.test(h) ? h : `Ustun ${idx + 1}`;
                    return (
                      <option key={idx} value={idx}>
                        {label}{sample ? ` — masalan: "${sample.length > 30 ? sample.slice(0, 30) + "…" : sample}"` : ""}
                      </option>
                    );
                  })}
                </select>
                {f.hint && <p className="text-[11px] text-gray-400 mt-0.5">{f.hint}</p>}
              </div>
            ))}

            {rows.length > 0 && mapping.name !== "" && mapping.price !== "" && (
              <div className="border rounded-lg overflow-hidden mt-3">
                <p className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1">
                  Ko'rinish (dastlabki 3 qator, {validRows().length}/{rows.length} qator import qilinadi):
                </p>
                <table className="w-full text-xs">
                  <tbody>
                    {validRows().slice(0, 3).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-semibold">{cellToStr(r[colIndex("name")])}</td>
                        <td className="p-2">{parsePrice(r[colIndex("price")]).toLocaleString()}₩</td>
                        <td className="p-2 text-gray-500 truncate max-w-[150px]">
                          {colIndex("description") >= 0 ? cellToStr(r[colIndex("description")]) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <label className="flex items-center gap-2 p-3 rounded-xl mt-2" style={{ backgroundColor: "#fee2e2" }}>
              <input type="checkbox" checked={deleteExisting} onChange={(e) => setDeleteExisting(e.target.checked)} className="w-5 h-5" />
              <span className="text-sm font-semibold" style={{ color: "#991b1b" }}>
                Import qilishdan oldin "{targetCategory.trim() || "..."}" dagi hozirgi {existingCount ?? "..."} ta mahsulotni o'chirish
              </span>
            </label>

            <button
              onClick={handleImport}
              disabled={importing || mapping.name === "" || mapping.price === "" || !targetCategory.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold"
            >
              {importing ? (progress || "Import qilinmoqda...") : `Import qilish (${validRows().length} ta)`}
            </button>
          </div>
        )}

        {resultMsg && (
          <div className="rounded-xl p-3 text-sm font-bold" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
            {resultMsg}
          </div>
        )}
      </div>
    </main>
  );
}
