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
  hidden?: boolean | null;
};

type BulkAction = "" | "move" | "delete" | "in_stock" | "out_of_stock" | "hide" | "show";

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

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [bulkTargetCategory, setBulkTargetCategory] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

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

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (groupProducts: Product[]) => {
    const ids = groupProducts.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkAction("");
    setBulkTargetCategory("");
  };

  const applyBulkAction = async () => {
    if (selectedIds.size === 0) { alert("Avval kamida bitta mahsulotni belgilang."); return; }
    if (!bulkAction) { alert("Amal turini tanlang."); return; }
    const ids = Array.from(selectedIds);

    if (bulkAction === "move") {
      if (!bulkTargetCategory) { alert("Qaysi kategoriyaga o'tkazishni tanlang."); return; }
      if (!confirm(`${ids.length} ta mahsulotni "${bulkTargetCategory}" kategoriyasiga o'tkazmoqchimisiz?`)) return;
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ category: bulkTargetCategory }).in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    } else if (bulkAction === "delete") {
      if (!confirm(`${ids.length} ta mahsulotni butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!`)) return;
      setBulkBusy(true);
      const { error } = await supabase.from("products").delete().in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    } else if (bulkAction === "in_stock" || bulkAction === "out_of_stock") {
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ in_stock: bulkAction === "in_stock" }).in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    } else if (bulkAction === "hide" || bulkAction === "show") {
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ hidden: bulkAction === "hide" }).in("id", ids);
      setBulkBusy(false);
      if (error) {
        alert(
          "Xatolik: " + error.message +
          "\n\nEslatma: bazangizda \"hidden\" ustuni bo'lmasa, avval Supabase SQL Editor'da quyidagini ishga tushiring:\nALTER TABLE products ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;"
        );
        return;
      }
    }

    clearSelection();
    await loadProducts();
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(adminSearch.toLowerCase()));
  const knownCategoryNames = categoriesList.map((c) => c.name);
  const orphanCategories = [...new Set(products.map((p) => p.category))].filter(
    (name) => !knownCategoryNames.includes(name)
  );
  const productGroups = [...knownCategoryNames, ...orphanCategories];

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

        <div className="bg-gray-50 border rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-bold text-black">
            📋 Ommaviy amal {selectedIds.size > 0 ? `— ${selectedIds.size} ta mahsulot belgilangan` : "(pastdan mahsulot(lar)ni belgilang)"}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as BulkAction)}
              className="flex-1 border p-2.5 rounded-xl bg-white text-black text-sm"
            >
              <option value="">Amal turini tanlang...</option>
              <option value="move">📂 Boshqa kategoriyaga o'tkazish</option>
              <option value="in_stock">✅ Sotuvda bor qilish</option>
              <option value="out_of_stock">🚫 Sotuvda yo'q qilish</option>
              <option value="hide">🙈 Berkitish (mijozlarga ko'rinmasin)</option>
              <option value="show">👁️ Ochish (mijozlarga ko'rinsin)</option>
              <option value="delete">🗑️ O'chirish</option>
            </select>
            {bulkAction === "move" && (
              <select
                value={bulkTargetCategory}
                onChange={(e) => setBulkTargetCategory(e.target.value)}
                className="flex-1 border p-2.5 rounded-xl bg-white text-black text-sm"
              >
                <option value="">Qaysi kategoriyaga?</option>
                {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyBulkAction}
              disabled={bulkBusy || selectedIds.size === 0 || !bulkAction}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl"
            >
              {bulkBusy ? "Bajarilmoqda..." : "✅ Bajarish"}
            </button>
            {selectedIds.size > 0 && (
              <button onClick={clearSelection} className="px-4 bg-gray-200 text-black text-sm font-bold rounded-xl">
                Bekor qilish
              </button>
            )}
          </div>
        </div>

        {adminSearch.trim() ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 px-1">
              <input
                type="checkbox"
                checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id))}
                onChange={() => toggleSelectGroup(filteredProducts)}
              />
              Qidiruv natijalarining barchasini belgilash
            </label>
            {filteredProducts.map((p) => (
              <ProductRow key={p.id} p={p} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelect} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} onToggleHot={toggleHot} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {productGroups.map((groupName) => {
              const groupProducts = products.filter((p) => p.category === groupName);
              return (
                <div key={groupName} className="bg-white border rounded-xl overflow-hidden">
                  <div className="w-full p-4 flex justify-between items-center gap-2">
                    <button onClick={() => setOpenGroup(openGroup === groupName ? null : groupName)} className="flex-1 flex justify-between items-center text-left">
                      <span className="font-bold text-black">{groupName}</span>
                      <span className="text-green-700 text-xl mr-2">{openGroup === groupName ? "−" : "+"}</span>
                    </button>
                    <input
                      type="checkbox"
                      title="Shu kategoriyadagi barchasini belgilash"
                      checked={groupProducts.length > 0 && groupProducts.every((p) => selectedIds.has(p.id))}
                      onChange={() => toggleSelectGroup(groupProducts)}
                    />
                  </div>
                  {openGroup === groupName && (
                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                      {groupProducts.map((p) => (
                        <ProductRow key={p.id} p={p} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelect} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} onToggleHot={toggleHot} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductRow({ p, selected, onToggleSelect, onEdit, onDelete, onToggleStock, onToggleHot }: {
  p: Product;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  onToggleStock: (p: Product) => void;
  onToggleHot: (p: Product) => void;
}) {
  return (
    <div className={`border rounded-xl p-3 flex items-center gap-3 ${selected ? "ring-2 ring-green-500 bg-green-50" : ""}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(p.id)}
        className="flex-shrink-0 w-4 h-4"
      />
      {p.image ? (
        <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Rasm yo'q</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-black truncate">
          {p.name} {p.hidden ? <span className="text-xs font-bold text-gray-400">🙈 berkitilgan</span> : null}
        </p>
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