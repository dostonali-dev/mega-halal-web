"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = { id: number; name: string };

export default function NewProductPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
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
  }, [checkedLogin]);

  const resetForm = () => {
    setName(""); setPrice(""); setCategory(""); setDescription("");
    setSupplier(""); setStock(""); setDiscountPrice("");
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
        description: description || null, supplier: supplier || null,
        stock: stock ? Number(stock) : 0,
        discount_price: discountPrice ? Number(discountPrice) : null,
        in_stock: true,
      }]);
      if (error) { alert("Xato: " + error.message); setSaving(false); return; }
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
      <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
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
        <input type="text" placeholder="Firma / yetkazib beruvchi (faqat siz ko'rasiz)" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full border p-3 rounded-xl bg-yellow-50 text-black" />
        <input type="number" placeholder="Chegirma narxi (ixtiyoriy)" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-orange-50 text-black" />

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