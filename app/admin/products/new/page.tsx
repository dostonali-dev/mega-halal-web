"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/imageCompress";
import ParentProductPicker from "@/components/ParentProductPicker";

type Category = { id: number; name: string; icon: string | null };
type ProductOption = { id: number; name: string };

// Kelgan narx asosida ustama foizini hisoblaydi (masalan kelgan narx 8000,
// sotish narxi 9490 bo'lsa -> "18.6" qaytaradi). Kelgan narx bo'sh/0 bo'lsa
// yoki narx raqam bo'lmasa, bo'sh qator qaytaradi (foiz ko'rsatilmaydi).
function calcMarginPercent(cost: string, price: string): string {
  const c = Number(cost);
  const p = Number(price);
  if (!c || c <= 0 || !Number.isFinite(p)) return "";
  const pct = ((p - c) / c) * 100;
  if (!Number.isFinite(pct)) return "";
  return String(Math.round(pct * 10) / 10);
}

export default function NewProductPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [marginPercent, setMarginPercent] = useState("");
  const [gram, setGram] = useState("");
  const [weightUnit, setWeightUnit] = useState("");
  const [productCode, setProductCode] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [parentProductId, setParentProductId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  useEffect(() => {
    if (!checkedLogin) return;
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      if (data) setCategoriesList(data);
    });
    // "Bosh mahsulot" tanlovi uchun - bu mahsulot boshqasining varianti
    // (lazzat turi) bo'lsa, qaysi mahsulotga bog'lanishini shu ro'yxatdan
    // tanlaydi.
    supabase.from("products").select("id, name").order("name").then(({ data }) => {
      if (data) setProductOptions(data);
    });
  }, [checkedLogin]);

  const resetForm = () => {
    setName(""); setPrice(""); setCostPrice(""); setMarginPercent(""); setGram(""); setWeightUnit("gr"); setProductCode(""); setManufacturer(""); setExpiryDate(""); setCategory(""); setDescription("");
    setKeywords("");
    setSupplier(""); setStock(""); setDiscountPrice(""); setIsHot(false);
    setParentProductId(""); setVariantName("");
    setImageFile(null); setImagePreview("");
  };

  // Narx, kelgan narx va foiz - uchalasi bir-biriga bog'liq: qaysi
  // birini o'zgartirsangiz, qolganlari mos ravishda yangilanadi.
  const handlePriceChange = (val: string) => {
    setPrice(val);
    setMarginPercent(calcMarginPercent(costPrice, val));
  };
  const handleCostPriceChange = (val: string) => {
    setCostPrice(val);
    setMarginPercent(calcMarginPercent(val, price));
  };
  const handleMarginChange = (val: string) => {
    setMarginPercent(val);
    const cost = Number(costPrice);
    const pct = Number(val);
    if (cost > 0 && Number.isFinite(pct)) {
      setPrice(String(Math.round(cost * (1 + pct / 100))));
    }
  };

  const handleAddProduct = async () => {
    if (!name.trim() || !price || !category.trim()) {
      alert("Nomi, narxi va kategoriyani to'ldiring!");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const compressedFile = await compressImage(imageFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, compressedFile);
        if (uploadError) { alert("Rasm yuklanmadi: " + uploadError.message); setSaving(false); return; }
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("products").insert([{
        name, price: Number(price), cost_price: costPrice ? Number(costPrice) : null, gram: gram ? Number(gram) : null, weight_unit: gram ? weightUnit : null, product_code: productCode.trim() || null, manufacturer: manufacturer.trim() || null, expiry_date: expiryDate || null, category, image: imageUrl || null,
        description: description || null, keywords: keywords.trim() || null, supplier: supplier || null,
        stock: stock ? Number(stock) : 0,
        discount_price: discountPrice ? Number(discountPrice) : null,
        is_hot: isHot,
        in_stock: true,
        parent_product_id: parentProductId ? Number(parentProductId) : null,
        variant_name: variantName.trim() || null,
      }]);
      if (error) {
        alert(
          "Xato: " + error.message +
          (error.message.includes("keywords")
            ? "\n\nEslatma: bazangizda \"keywords\" ustuni bo'lmasa, avval Supabase SQL Editor'da quyidagini ishga tushiring:\nALTER TABLE products ADD COLUMN IF NOT EXISTS keywords text;"
            : "")
        );
        setSaving(false);
        return;
      }
      alert("Mahsulot qo'shildi ✅");
      resetForm();
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    }
    setSaving(false);
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">Yangi mahsulot qo'shish</h1>

      <div className="max-w-md space-y-4">
        <input type="text" placeholder="Mahsulot nomi" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
        <div>
          <input type="text" placeholder="Ishlab chiqaruvchi (ixtiyoriy)" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
          <p className="text-xs text-gray-400 mt-1 px-1">Mijozga mahsulot kartasida ko'rinadi. Bo'sh qoldirilsa, hech narsa ko'rsatilmaydi.</p>
        </div>
        <div className="relative">
          <input type="number" placeholder="Narxi" value={price} onChange={(e) => handlePriceChange(e.target.value)} className="w-full border p-3 pr-10 rounded-xl bg-white text-black" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₩</span>
        </div>
        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type="number" placeholder="Kelgan narxi (ixtiyoriy)" value={costPrice} onChange={(e) => handleCostPriceChange(e.target.value)} className="w-full border p-3 pr-10 rounded-xl bg-yellow-50 text-black" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₩</span>
            </div>
            <div className="relative" style={{ width: "88px" }}>
              <input type="number" placeholder="Foiz" value={marginPercent} onChange={(e) => handleMarginChange(e.target.value)} className="w-full border p-3 pr-6 rounded-xl bg-yellow-50 text-black" />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">%</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1 px-1">Faqat siz ko'rasiz. Foizni kiritsangiz - narxi avtomatik hisoblanadi; narxni o'zgartirsangiz - foiz o'zi yangilanadi.</p>
        </div>
        <div className="flex gap-2">
          <input type="number" step="0.01" placeholder="Og'irligi / hajmi (ixtiyoriy)" value={gram} onChange={(e) => setGram(e.target.value)} className="flex-1 border p-3 rounded-xl bg-white text-black" />
          <input
            type="text"
            placeholder="gr"
            value={weightUnit}
            onChange={(e) => setWeightUnit(e.target.value)}
            maxLength={10}
            style={{ width: "88px" }}
            className="border p-3 rounded-xl bg-white text-black"
          />
        </div>
        <input type="text" placeholder="Mahsulot kodi / barkod (faqat siz ko'rasiz, mijozga ko'rinmaydi)" value={productCode} onChange={(e) => setProductCode(e.target.value)} className="w-full border p-3 rounded-xl bg-yellow-50 text-black" />
        <input type="number" placeholder="Soni (ombordagi miqdor)" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />

        <div>
          <label className="text-xs font-bold text-gray-500 px-1">Muddati (yaroqlilik sanasi, ixtiyoriy)</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black mt-1" />
        </div>

        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 border p-3 rounded-xl bg-white text-black">
            <option value="">Kategoriyani tanlang</option>
            {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <Link href="/admin/categories" className="bg-gray-200 text-black px-4 rounded-xl text-sm font-bold whitespace-nowrap flex items-center">
            + Yangi
          </Link>
        </div>

        <textarea placeholder="Mahsulot tavsifi (ixtiyoriy)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" rows={3} />
        <div>
          <input type="text" placeholder="Kalit so'zlar (vergul bilan, masalan: rolton, lapsha)" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full border p-3 rounded-xl bg-green-50 text-black" />
          <p className="text-xs text-gray-400 mt-1 px-1">Mijoz qidirganda mahsulot nomi topilmasa ham, shu so'zlar orqali topiladi.</p>
        </div>
        <input type="text" placeholder="Firma / yetkazib beruvchi (faqat siz ko'rasiz)" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full border p-3 rounded-xl bg-yellow-50 text-black" />
        <input type="number" placeholder="Chegirma narxi (ixtiyoriy)" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-orange-50 text-black" />

        <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <p className="text-sm font-bold" style={{ color: "#166534" }}>🍹 Variant (agar bu mahsulotning lazzat/turi bo'lsa)</p>
          <ParentProductPicker options={productOptions} value={parentProductId} onChange={setParentProductId} />
          <input
            type="text"
            placeholder="Qisqa nomi (masalan: Lime, Qulupnay) - lazzat tanlash tugmasida shu ko'rinadi"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            className="w-full border p-3 rounded-xl bg-white text-black"
          />
          <p className="text-xs" style={{ color: "#166534" }}>
            "Bosh mahsulot" tanlansa - bu mahsulot ro'yxatlarda alohida ko'rinmaydi, faqat tanlangan mahsulot sahifasida "lazzat tanlash" tugmasi sifatida chiqadi.
          </p>
        </div>

        <label
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{ backgroundColor: "#dbeafe" }}
        >
          <input type="checkbox" checked={isHot} onChange={(e) => setIsHot(e.target.checked)} className="w-5 h-5" />
          <span className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>
            🇺🇿 O'zbekiston tovari (bosh sahifadagi "O'zbekiston" bo'limida ko'rinadi)
          </span>
        </label>

        <div className="border-2 border-dashed rounded-xl p-4 text-center bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">📷 Mahsulot rasmi</p>
          <input type="file" accept="image/*" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
          }} className="w-full text-black" />
          {imagePreview && <img src={imagePreview} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-xl border mx-auto" />}
        </div>

        <button onClick={handleAddProduct} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl">
          {saving ? "Saqlanmoqda..." : "Mahsulot qo'shish"}
        </button>
      </div>
    </main>
  );
}