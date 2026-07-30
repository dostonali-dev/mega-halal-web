"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string | null;
  description?: string | null;
  stock?: number | null;
  in_stock?: boolean | null;
  supplier?: string | null;
  discount_price?: number | null;
  is_hot?: boolean | null;
  hidden?: boolean | null;
  product_code?: string | null;
};

type Category = { id: number; name: string; icon: string | null };

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [checkedLogin, setCheckedLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [productCode, setProductCode] = useState("");
  const [isHot, setIsHot] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  useEffect(() => {
    if (!checkedLogin || !productId) return;
    (async () => {
      setLoading(true);
      const [{ data: product, error }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("categories").select("*").order("name"),
      ]);
      setCategoriesList(cats || []);
      if (error || !product) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const p = product as Product;
      setName(p.name);
      setPrice(String(p.price));
      setCategory(p.category);
      setDescription(p.description || "");
      setSupplier(p.supplier || "");
      setStock(p.stock != null ? String(p.stock) : "");
      setDiscountPrice(p.discount_price != null ? String(p.discount_price) : "");
      setProductCode(p.product_code || "");
      setIsHot(p.is_hot === true);
      setExistingImage(p.image || "");
      setLoading(false);
    })();
  }, [checkedLogin, productId]);

  const handleSaveProduct = async () => {
    if (!name.trim() || !price || !category.trim()) {
      alert("Nomi, narxi va kategoriyani to'ldiring!");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = existingImage;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from("products").upload(fileName, imageFile);
        if (uploadError) { alert("Rasm yuklanmadi: " + uploadError.message); setSaving(false); return; }
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
      const payload = {
        name, price: Number(price), category, image: imageUrl || null,
        description: description || null, supplier: supplier || null,
        // Bo'sh qoldirilsa -> null (soni kuzatilmayapti, cheklovsiz sotiladi).
        // Aniq son (0 ham) kiritilsa -> shu son qat'iy chegara bo'ladi.
        stock: stock.trim() !== "" ? Number(stock) : null,
        discount_price: discountPrice ? Number(discountPrice) : null,
        product_code: productCode.trim() || null,
        is_hot: isHot,
      };
      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) { alert("Xato: " + error.message); setSaving(false); return; }
      alert("Mahsulot yangilandi ✅");
      router.push("/admin/products");
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
      setSaving(false);
    }
  };

  if (!checkedLogin) return null;

  if (loading) {
    return (
      <main className="p-6 md:p-10">
        <p className="text-gray-500">Yuklanmoqda...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="p-6 md:p-10">
        <Link href="/admin/products" className="text-green-700 font-semibold">← Mahsulotlar</Link>
        <p className="mt-4 text-red-600 font-bold">Mahsulot topilmadi.</p>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <Link href="/admin/products" className="text-green-700 font-semibold">← Mahsulotlar</Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">Mahsulotni tahrirlash</h1>

      <div className="max-w-md space-y-4 bg-gray-50 border rounded-xl p-4">
        <input type="text" placeholder="Mahsulot nomi" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
        <input type="number" placeholder="Narxi" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
        <input type="number" placeholder="Soni (bo'sh = cheklovsiz, 0 = sotuvda yo'q)" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black">
          <option value="">Kategoriyani tanlang</option>
          {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>

        <textarea placeholder="Mahsulot tavsifi (ixtiyoriy)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" rows={3} />
        <input type="text" placeholder="Firma / yetkazib beruvchi (faqat siz ko'rasiz)" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full border p-3 rounded-xl bg-yellow-50 text-black" />
        <input type="text" placeholder="Mahsulot kodi / barkod (faqat siz ko'rasiz, mijozga ko'rinmaydi)" value={productCode} onChange={(e) => setProductCode(e.target.value)} className="w-full border p-3 rounded-xl bg-yellow-50 text-black" />
        <input type="number" placeholder="Chegirma narxi (ixtiyoriy)" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-orange-50 text-black" />

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
          {(imagePreview || existingImage) && (
            <img src={imagePreview || existingImage} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-xl border mx-auto" />
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={handleSaveProduct} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl">
            {saving ? "Saqlanmoqda..." : "Yangilash"}
          </button>
          <Link href="/admin/products" className="px-4 bg-gray-200 text-black rounded-xl font-bold flex items-center justify-center">
            Bekor qilish
          </Link>
        </div>
      </div>
    </main>
  );
}
