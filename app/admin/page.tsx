"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
};

type Category = { id: number; name: string };

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [categoryMode, setCategoryMode] = useState<"select" | "new">("select");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn === "true") setLoggedIn(true);
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setProducts(data || []);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error) setCategoriesList(data || []);
  };

  useEffect(() => {
    if (loggedIn) {
      loadProducts();
      loadCategories();
    }
  }, [loggedIn]);

  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      setLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
    } else {
      alert("Login yoki parol noto'g'ri");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setLoggedIn(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setCategory("");
    setCategoryMode("select");
    setDescription("");
    setSupplier("");
    setStock("");
    setImageFile(null);
    setImagePreview("");
    setExistingImage("");
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setCategory(p.category);
    setCategoryMode("select");
    setDescription(p.description || "");
    setSupplier(p.supplier || "");
    setStock(p.stock != null ? String(p.stock) : "");
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
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(fileName, imageFile);

        if (uploadError) {
          alert("Rasm yuklanmadi: " + uploadError.message);
          setSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const payload = {
        name,
        price: Number(price),
        category,
        image: imageUrl || null,
        description: description || null,
        supplier: supplier || null,
        stock: stock ? Number(stock) : 0,
      };

      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) { alert("Xato: " + error.message); setSaving(false); return; }
        alert("Mahsulot yangilandi ✅");
      } else {
        const { error } = await supabase.from("products").insert([{ ...payload, in_stock: true }]);
        if (error) { alert("Xato: " + error.message); setSaving(false); return; }
        alert("Mahsulot qo'shildi ✅");
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
    if (error) {
      alert("Xatolik: " + error.message);
      console.error(error);
      return;
    }
    loadProducts();
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCategoryName.trim() });
    if (error) {
      alert("Xato: " + error.message);
      return;
    }
    setNewCategoryName("");
    loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Bu kategoriyani o'chirmoqchimisiz? Mavjud mahsulotlar o'zgarmaydi, faqat yangi mahsulot qo'shishda bu kategoriya ro'yxatda ko'rinmay qoladi.")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(adminSearch.toLowerCase())
  );
  const productGroups = [...new Set(products.map((p) => p.category))];

  if (!loggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
          <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
            Mega Halal Admin
          </h1>

          <input
            type="text"
            placeholder="Login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 text-black p-3 rounded-xl mb-4"
          />

          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 text-black p-3 rounded-xl mb-4"
          />

          <button onClick={handleLogin} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl">
            Kirish
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-4xl font-bold">Mega Halal Admin Panel</h1>
      <p className="mt-4 text-green-600">Muvaffaqiyatli kirdingiz ✅</p>

      <div className="flex gap-3 mt-4 mb-6">
        <Link href="/admin/orders" className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl">
          📦 Buyurtmalar
        </Link>
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-3 rounded-xl">
          🚪 Chiqish
        </button>
      </div>

      {/* Kategoriyalarni boshqarish */}
      <div className="max-w-md mb-8 bg-gray-50 border rounded-xl p-4">
        <h2 className="text-lg font-bold text-black mb-3">Kategoriyalarni boshqarish</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Yangi kategoriya nomi"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 border p-2 rounded-xl bg-white text-black"
          />
          <button onClick={handleAddCategory} className="bg-green-600 text-white px-4 rounded-xl font-bold">
            + Qo'shish
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoriesList.map((c) => (
            <span key={c.id} className="bg-white border rounded-full px-3 py-1 text-sm text-black flex items-center gap-2">
              {c.name}
              <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 font-bold">✕</button>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-xl font-bold text-black">
          {editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
        </h2>

        <input
          type="text"
          placeholder="Mahsulot nomi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <input
          type="number"
          placeholder="Narxi"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <input
          type="number"
          placeholder="Soni (ombordagi miqdor)"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        {categoryMode === "select" ? (
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 border p-3 rounded-xl bg-white text-black"
            >
              <option value="">Kategoriyani tanlang</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setCategoryMode("new"); setCategory(""); }}
              className="bg-gray-200 text-black px-4 rounded-xl text-sm font-bold whitespace-nowrap"
            >
              + Yangi
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Yangi kategoriya nomi"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 border p-3 rounded-xl bg-white text-black"
            />
            <button
              type="button"
              onClick={() => { setCategoryMode("select"); setCategory(""); }}
              className="bg-gray-200 text-black px-4 rounded-xl text-sm font-bold whitespace-nowrap"
            >
              Ro'yxatdan
            </button>
          </div>
        )}

        <textarea
          placeholder="Mahsulot tavsifi (ixtiyoriy)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
          rows={3}
        />

        <input
          type="text"
          placeholder="Firma / yetkazib beruvchi (faqat siz ko'rasiz)"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="w-full border p-3 rounded-xl bg-yellow-50 text-black"
        />

        <div className="border-2 border-dashed rounded-xl p-4 text-center bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">📷 Mahsulot rasmi</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
            }}
            className="w-full text-black"
          />
          {(imagePreview || existingImage) && (
            <img src={imagePreview || existingImage} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-xl border mx-auto" />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveProduct}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl"
          >
            {saving ? "Saqlanmoqda..." : editingId ? "Yangilash" : "Mahsulot qo'shish"}
          </button>
          {editingId && (
            <button onClick={resetForm} className="px-4 bg-gray-200 text-black rounded-xl font-bold">
              Bekor qilish
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="text-xl font-bold text-black mb-4">Mahsulotlar ro'yxati ({products.length})</h2>

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
              <ProductRow key={p.id} p={p} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {productGroups.map((groupName) => (
              <div key={groupName} className="bg-white border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenGroup(openGroup === groupName ? null : groupName)}
                  className="w-full p-4 flex justify-between items-center"
                >
                  <span className="font-bold text-black">{groupName}</span>
                  <span className="text-green-700 text-xl">{openGroup === groupName ? "−" : "+"}</span>
                </button>
                {openGroup === groupName && (
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    {products.filter((p) => p.category === groupName).map((p) => (
                      <ProductRow key={p.id} p={p} onEdit={handleEditProduct} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} />
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

function ProductRow({
  p,
  onEdit,
  onDelete,
  onToggleStock,
}: {
  p: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  onToggleStock: (p: Product) => void;
}) {
  return (
    <div className="border rounded-xl p-3 flex items-center gap-3">
      {p.image ? (
        <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
          Rasm yo'q
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-black truncate">{p.name}</p>
        <p className="text-sm text-gray-500">
          {p.price.toLocaleString()}₩ · Soni: {p.stock ?? 0}
          {p.supplier ? ` · 🏭 ${p.supplier}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => onToggleStock(p)}
          className={`text-xs font-bold px-3 py-1 rounded-full ${p.in_stock === false ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
        >
          {p.in_stock === false ? "Sotuvda yo'q" : "Sotuvda bor"}
        </button>
        <div className="flex gap-2">
          <button onClick={() => onEdit(p)} className="text-blue-600 text-xs font-bold underline">
            Tahrirlash
          </button>
          <button onClick={() => onDelete(p.id)} className="text-red-500 text-xs font-bold underline">
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}