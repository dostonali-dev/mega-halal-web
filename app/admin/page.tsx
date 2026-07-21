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
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [categoryMode, setCategoryMode] = useState<"select" | "new">("select");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [adminSearch, setAdminSearch] = useState("");

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

  useEffect(() => {
    if (loggedIn) loadProducts();
  }, [loggedIn]);

  const existingCategories = [...new Set(products.map((p) => p.category))];

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
    setName("");
    setPrice("");
    setCategory("");
    setCategoryMode("select");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
  };

  const handleAddProduct = async () => {
    if (!name.trim() || !price || !category.trim()) {
      alert("Barcha maydonlarni to'ldiring!");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = "";

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

      const { error } = await supabase.from("products").insert([
        {
          name,
          price: Number(price),
          category,
          image: imageUrl || null,
          description: description || null,
        },
      ]);

      if (error) {
        alert("Xato: " + error.message);
        setSaving(false);
        return;
      }

      alert("Mahsulot qo'shildi ✅");
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

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(adminSearch.toLowerCase())
  );

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
        <Link href="/admin" className="flex-1 bg-green-600 text-white text-center py-3 rounded-xl">
          ➕ Mahsulotlar
        </Link>
        <Link href="/admin/orders" className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl">
          📦 Buyurtmalar
        </Link>
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-3 rounded-xl">
          🚪 Chiqish
        </button>
      </div>

      <div className="mt-8 max-w-md space-y-4">
        <h2 className="text-xl font-bold text-black">Yangi mahsulot qo'shish</h2>

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

        {categoryMode === "select" ? (
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 border p-3 rounded-xl bg-white text-black"
            >
              <option value="">Kategoriyani tanlang</option>
              {existingCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
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
          {imagePreview && (
            <img src={imagePreview} alt="preview" className="mt-3 w-32 h-32 object-cover rounded-xl border mx-auto" />
          )}
        </div>

        <button
          onClick={handleAddProduct}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl"
        >
          {saving ? "Saqlanmoqda..." : "Mahsulot qo'shish"}
        </button>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="text-xl font-bold text-black mb-4">Mahsulotlar ro'yxati ({filteredProducts.length})</h2>

        <input
          type="text"
          placeholder="🔎 Mahsulot qidirish..."
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black mb-4"
        />

        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-3 flex items-center gap-3">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg border" />
              ) : (
                <div className="w-14 h-14 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                  Rasm yo'q
                </div>
              )}
              <div className="flex-1">
                <p className="font-bold text-black">{p.name}</p>
                <p className="text-sm text-gray-500">{p.category} · {p.price.toLocaleString()}₩</p>
              </div>
              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 text-sm font-bold underline">
                O'chirish
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}