"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Excel (.xlsx/.xls/.csv) fayldan mahsulotlarni ommaviy import qilish.
// Har doim "Umumiy" kategoriyasiga tushadi (yo'q bo'lsa avtomatik yaratiladi).
// Fayldagi ustunlar turlicha nomlangan bo'lishi mumkin (masalan koreyscha
// "원산지"), shuning uchun foydalanuvchi har bir maydonni qaysi ustunga mos
// kelishini o'zi tanlaydi (ustun moslashtirish).

const TARGET_CATEGORY = "Umumiy";

type FieldKey = "name" | "price" | "description" | "image" | "stock" | "productCode" | "keywords";

const FIELD_DEFS: { key: FieldKey; label: string; required?: boolean; hint?: string }[] = [
  { key: "name", label: "Mahsulot nomi", required: true },
  { key: "price", label: "Narxi", required: true },
  { key: "description", label: "Tavsif (masalan, 원산지 ustuni)", hint: "Bu ustundagi matn mahsulot tavsifiga yoziladi" },
  { key: "image", label: "Rasm URL", hint: "Faylda tayyor rasm havolasi bo'lsa" },
  { key: "stock", label: "Soni (ombordagi miqdor)" },
  { key: "productCode", label: "Mahsulot kodi / barkod" },
  { key: "keywords", label: "Kalit so'zlar" },
];

function parsePrice(raw: any): number {
  const s = String(raw ?? "").replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export default function ImportProductsPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);

  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({
    name: "", price: "", description: "", image: "", stock: "", productCode: "", keywords: "",
  });
  const [parsing, setParsing] = useState(false);
  const [existingCount, setExistingCount] = useState<number | null>(null);
  const [deleteExisting, setDeleteExisting] = useState(true);
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
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", TARGET_CATEGORY)
      .then(({ count }) => setExistingCount(count ?? 0));
  }, [checkedLogin]);

  const handleFile = async (file: File) => {
    setParsing(true);
    setResultMsg("");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const hdrs = (raw[0] || []).map((h) => String(h).trim());
      const dataRows = raw.slice(1).filter((r) => r.some((cell) => String(cell).trim() !== ""));
      setHeaders(hdrs);
      setRows(dataRows);
      setFileName(file.name);

      // Ustun nomlariga qarab avtomatik mos kelishini taxmin qilishga urinib ko'ramiz.
      const guess = (candidates: string[]) =>
        hdrs.find((h) => candidates.some((c) => h.toLowerCase().includes(c.toLowerCase()))) || "";
      setMapping({
        name: guess(["nomi", "name", "상품명", "제품명", "품명"]),
        price: guess(["narx", "price", "가격", "단가"]),
        description: guess(["원산지", "tavsif", "description", "origin"]),
        image: guess(["rasm", "image", "이미지", "사진"]),
        stock: guess(["soni", "stock", "수량", "재고"]),
        productCode: guess(["kod", "barkod", "barcode", "code", "코드"]),
        keywords: guess(["kalit", "keyword", "키워드"]),
      });
    } catch (e: any) {
      console.error(e);
      alert("Faylni o'qib bo'lmadi: " + (e?.message || e));
    }
    setParsing(false);
  };

  const colIndex = (field: FieldKey) => headers.indexOf(mapping[field]);

  const handleImport = async () => {
    if (!mapping.name || !mapping.price) {
      alert("Kamida \"Mahsulot nomi\" va \"Narxi\" ustunlarini tanlang.");
      return;
    }
    if (rows.length === 0) {
      alert("Import qilinadigan qator topilmadi.");
      return;
    }
    if (!confirm(`${rows.length} ta mahsulot "${TARGET_CATEGORY}" kategoriyasiga import qilinsinmi?`)) return;

    setImporting(true);
    setResultMsg("");
    try {
      // 1) "Umumiy" kategoriyasi mavjudligini tekshirish, bo'lmasa yaratish.
      const { data: existingCat } = await supabase.from("categories").select("id").eq("name", TARGET_CATEGORY).maybeSingle();
      if (!existingCat) {
        await supabase.from("categories").insert({ name: TARGET_CATEGORY, icon: "📦" });
      }

      // 2) Kerak bo'lsa, "Umumiy" dagi eski mahsulotlarni o'chirish.
      if (deleteExisting) {
        setProgress("Eski mahsulotlar o'chirilmoqda...");
        const { error: delError } = await supabase.from("products").delete().eq("category", TARGET_CATEGORY);
        if (delError) throw delError;
      }

      // 3) Qatorlarni mahsulot obyektlariga aylantirish.
      const nameIdx = colIndex("name");
      const priceIdx = colIndex("price");
      const descIdx = colIndex("description");
      const imageIdx = colIndex("image");
      const stockIdx = colIndex("stock");
      const codeIdx = colIndex("productCode");
      const kwIdx = colIndex("keywords");

      const products = rows
        .map((r) => {
          const name = String(r[nameIdx] ?? "").trim();
          if (!name) return null;
          return {
            name,
            price: parsePrice(r[priceIdx]),
            category: TARGET_CATEGORY,
            description: descIdx >= 0 ? String(r[descIdx] ?? "").trim() || null : null,
            image: imageIdx >= 0 ? String(r[imageIdx] ?? "").trim() || null : null,
            stock: stockIdx >= 0 && String(r[stockIdx] ?? "").trim() !== "" ? Number(String(r[stockIdx]).replace(/[^\d.-]/g, "")) : null,
            product_code: codeIdx >= 0 ? String(r[codeIdx] ?? "").trim() || null : null,
            keywords: kwIdx >= 0 ? String(r[kwIdx] ?? "").trim() || null : null,
            in_stock: true,
          };
        })
        .filter(Boolean) as any[];

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
      setResultMsg(`✅ ${inserted} ta mahsulot "${TARGET_CATEGORY}" kategoriyasiga muvaffaqiyatli qo'shildi.`);
      setRows([]);
      setHeaders([]);
      setFileName("");
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category", TARGET_CATEGORY);
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
      <p className="text-gray-500 text-sm mb-6">
        Fayldagi barcha mahsulotlar <b>"{TARGET_CATEGORY}"</b> kategoriyasiga qo'shiladi.
      </p>

      <div className="max-w-xl space-y-4">
        {existingCount !== null && (
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "#fef9c3", color: "#a16207" }}>
            Hozirda <b>"{TARGET_CATEGORY}"</b> kategoriyasida <b>{existingCount}</b> ta mahsulot bor.
          </div>
        )}

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
            <p className="text-xs text-gray-500">Faylingizdagi qaysi ustun qaysi maydonga mos kelishini tanlang.</p>
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
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                {f.hint && <p className="text-[11px] text-gray-400 mt-0.5">{f.hint}</p>}
              </div>
            ))}

            {rows.length > 0 && mapping.name && mapping.price && (
              <div className="border rounded-lg overflow-hidden mt-3">
                <p className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1">Ko'rinish (dastlabki 3 qator):</p>
                <table className="w-full text-xs">
                  <tbody>
                    {rows.slice(0, 3).map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 font-semibold">{r[colIndex("name")]}</td>
                        <td className="p-2">{parsePrice(r[colIndex("price")]).toLocaleString()}₩</td>
                        <td className="p-2 text-gray-500 truncate max-w-[150px]">
                          {colIndex("description") >= 0 ? r[colIndex("description")] : ""}
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
                Import qilishdan oldin "{TARGET_CATEGORY}" dagi hozirgi {existingCount ?? "..."} ta mahsulotni o'chirish
              </span>
            </label>

            <button
              onClick={handleImport}
              disabled={importing || !mapping.name || !mapping.price}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold"
            >
              {importing ? (progress || "Import qilinmoqda...") : `Import qilish (${rows.length} ta)`}
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
