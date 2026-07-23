"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
};

type Category = { id: number; name: string; icon: string | null };

export default function AdminProductsPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  const loadProducts = async () => {
    const { data, error } = await supabase.from("products").select("*").order("id", { ascending: false });
    if (!error) setProducts(data || []);
  };
  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error) setCategoriesList(data || []);
  };

  useEffect(() => {
    if (checkedLogin) {
      loadProducts();
      loadCategories();
    }
  }, [checkedLogin]);

  const resetForm = () => {
    setEditingId(null);
    setName(""); setPrice(""); setCategory(""); setDescription("");
    setSupplier(""); setStock(""); setDiscountPrice("");
    setImageFile(null); setImagePreview(""); setExistingImage("");
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setCategory(p.category);
    setDescription(p.description || "");
    setSupplier(p.supplier || "");
    setStock(p.stock != null ? String(p.stock) : "");
    setDiscountPrice(p.discount_price != null ? String(p.discount_price) : "");
    setImageFile(null);
    setImagePreview("");
    setExistingImage(p.image || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        stock: stock ? Number(stock) : 0,
        discount_price: discountPrice ? Number(discountPrice) : null,
      };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) { alert("Xato: " + error.message); setSaving(false); return; }
        alert("Mahsulot yangilandi ✅");
      }
      resetForm();
      await loadProducts();
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Bu mahsulotni o'chirmoqchimisiz?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const toggleInStock = async (p: Product) => {
    const newValue = p.in_stock === false ? true : false;
    const { error } = await supabase.from("products").update({ in_stock: newValue }).eq("id", p.id);
    if (error) { alert("Xatolik: " + error.message); return; }
    loadProducts();
  };

  const toggleHot = async (p: Product) => {
    const newValue = !p.is_hot;
    const { error } = await supabase.from("products").update({ is_hot: newValue }).eq("id", p.id);
    if (error) { alert("Xatolik: " + error.message); return; }
    loadProducts();
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(adminSearch.toLowerCase()));
  const productGroups = [...new Set(products.map((p) => p.category))];

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">Mahsulotlar</h1>

      {editingId && (
        <div className="max-w-md space-y-4 bg-gray-50 border rounded-xl p-4 mb-8">
          <h2 className="text-lg font-bold text-black">Mahsulotni tahrirlash</h2>

          <input type="text" placeholder="Mahsulot nomi" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
          <input type="number" placeholder="Narxi" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />
          <input type="number" placeholder="Soni (ombordagi miqdor)" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black" />

          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border p-3 rounded-xl bg-white text-black">
            <option value="">Kategoriyani tanlang</option>
            {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

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
            {(imagePreview || existingImage) && (
              <img src={imagePreview || existingImage} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-xl border mx-auto" />
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={handleSaveProduct} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl">
              {saving ? "Saqlanmoqda..." : "Yangilash"}
            </button>
            <button onClick={resetForm} className="px-4 bg-gray-200 text-black rounded-xl font-bold">Bekor qilish</button>
          </div>
        </div>
      )}

      <div className="max-w-2xl">
        <input
          type="text"
          placeholder="🔎 Mahsulot qidirish..."
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black mb-4"
        />

        {adminSearch.trim() ? (
          <div className="space-y-3">
            {filteredProducts.map((p) => (
              <ProductRow key={p.id} p={p} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} onToggleHot={toggleHot} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {productGroups.map((groupName) => (
              <div key={groupName} className="bg-white border rounded-xl overflow-hidden">
                <button onClick={() => setOpenGroup(openGroup === groupName ? null : groupName)} className="w-full p-4 flex justify-between items-center">
                  <span className="font-bold text-black">{groupName}</span>
                  <span className="text-green-700 text-xl">{openGroup === groupName ? "−" : "+"}</span>
                </button>
                {openGroup === groupName && (
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    {products.filter((p) => p.category === groupName).map((p) => (
                      <ProductRow key={p.id} p={p} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} onToggleHot={toggleHot} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductRow({ p, onEdit, onDelete, onToggleStock, onToggleHot }: {
  p: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  onToggleStock: (p: Product) => void;
  onToggleHot: (p: Product) => void;
}) {
  return (
    <div className="border rounded-xl p-3 flex items-center gap-3">
      {p.image ? (
        <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Rasm yo'q</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-black truncate">{p.name}</p>
        <p className="text-sm text-gray-500">
          {p.price.toLocaleString()}₩ · Soni: {p.stock ?? 0}{p.supplier ? ` · 🏭 ${p.supplier}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button onClick={() => onToggleStock(p)} className={`text-xs font-bold px-3 py-1 rounded-full ${p.in_stock === false ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
          {p.in_stock === false ? "Sotuvda yo'q" : "Sotuvda bor"}
        </button>
        <button
          onClick={() => onToggleHot(p)}
          className={`text-xs font-bold px-3 py-1 rounded-full ${p.is_hot ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}
        >
          {p.is_hot ? "🔥 HOT" : "HOT belgilash"}
        </button>
        <div className="flex gap-2">
          <button onClick={() => onEdit(p)} className="text-blue-600 text-xs font-bold underline">Tahrirlash</button>
          <button onClick={() => onDelete(p.id)} className="text-red-500 text-xs font-bold underline">O'chirish</button>
        </div>
      </div>
    </div>
  );
}