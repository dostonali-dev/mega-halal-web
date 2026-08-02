"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParentProductPicker from "@/components/ParentProductPicker";

type Category = { id: number; name: string; icon: string | null };
type ProductOption = { id: number; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
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
    setName(""); setPrice(""); setCategory(""); setDescription("");
    setKeywords("");
    setSupplier(""); setStock(""); setDiscountPrice(""); setIsHot(false);
    setParentProductId(""); setVariantName("");
    setImageFile(null); setImagePreview("");
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
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, imageFile);
        if (uploadError) { alert("Rasm yuklanmadi: " + uploadError.message); setSaving(false); return; }
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from("products").insert([{
        name, price: Number(price), category, image: imageUrl || null,
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
        <input type="number" placeholder="Narxi" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
        <input type="number" placeholder="Soni (ombordagi miqdor)" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />

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