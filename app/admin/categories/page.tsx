"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = {
  id: number;
  name: string;
  icon: string | null;
  image_url?: string | null;
  sort_order?: number | null;
};

const SUGGESTED_ICONS = ["🍞", "🥛", "🥩", "🍗", "🥤", "🍬", "🍫", "🧊", "🍚", "🌶️", "🧴", "🧼", "🍎", "🥬", "🐟", "🍜", "🧀", "🥚", "☕", "📦"];

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📦");
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState("");
  const [newCategorySortOrder, setNewCategorySortOrder] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("📦");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
    if (!error) setCategoriesList(data || []);
  };

  useEffect(() => {
    if (checkedLogin) loadCategories();
  }, [checkedLogin]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      image_url: newCategoryImageUrl.trim() || null,
      sort_order: newCategorySortOrder.trim() ? Number(newCategorySortOrder) : null,
    });
    if (error) { alert("Xato: " + error.message); return; }
    setNewCategoryName("");
    setNewCategoryIcon("📦");
    setNewCategoryImageUrl("");
    setNewCategorySortOrder("");
    loadCategories();
  };

  const handleDeleteAllCategories = async () => {
    if (!confirm("BARCHA kategoriyalarni o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi. Mavjud mahsulotlar o'zgarmaydi, faqat kategoriyalar ro'yxati bo'shab qoladi.")) return;
    const { error } = await supabase.from("categories").delete().neq("id", 0);
    if (error) {
      alert("O'chirishda xatolik: " + error.message);
      return;
    }
    loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Bu kategoriyani o'chirmoqchimisiz? Mavjud mahsulotlar o'zgarmaydi, faqat yangi mahsulot qo'shishda bu kategoriya ro'yxatda ko'rinmay qoladi.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      alert("O'chirishda xatolik: " + error.message);
      return;
    }
    loadCategories();
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon || "📦");
    setEditImageUrl(c.image_url || "");
    setEditSortOrder(c.sort_order != null ? String(c.sort_order) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditImageUrl("");
    setEditSortOrder("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("categories")
      .update({
        name: editName.trim(),
        icon: editIcon,
        image_url: editImageUrl.trim() || null,
        sort_order: editSortOrder.trim() ? Number(editSortOrder) : null,
      })
      .eq("id", editingId);
    setSaving(false);
    if (error) {
      alert("Saqlashda xatolik: " + error.message);
      return;
    }

    await supabase.from("products").update({ category: editName.trim() }).eq("category", categoriesList.find((c) => c.id === editingId)?.name || "");

    cancelEdit();
    loadCategories();
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
        <button onClick={handleDeleteAllCategories} className="text-red-500 text-sm font-bold underline">
          Barchasini o'chirish
        </button>
      </div>
      <h1 className="text-3xl font-bold mt-3 mb-6">Kategoriyalar</h1>

      <div className="max-w-md bg-gray-50 border rounded-xl p-4 mb-6">
        <h2 className="font-bold text-black mb-3">Yangi kategoriya</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Kategoriya nomi"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 border p-2 rounded-xl bg-white text-black"
          />
          <input
            type="number"
            placeholder="Tartib #"
            value={newCategorySortOrder}
            onChange={(e) => setNewCategorySortOrder(e.target.value)}
            className="w-24 border p-2 rounded-xl bg-white text-black"
          />
        </div>
        <input
          type="text"
          placeholder="Rasm URL (ixtiyoriy — bo'lmasa ikonka ishlatiladi)"
          value={newCategoryImageUrl}
          onChange={(e) => setNewCategoryImageUrl(e.target.value)}
          className="w-full border p-2 rounded-xl bg-white text-black mb-3"
        />
        <p className="text-xs text-gray-500 mb-2">Ikonka tanlang:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_ICONS.map((icon) => (
            <button
              key={icon}
              onClick={() => setNewCategoryIcon(icon)}
              className={`w-10 h-10 rounded-lg text-xl border ${newCategoryIcon === icon ? "border-green-600 bg-green-50" : "border-gray-200 bg-white"}`}
            >
              {icon}
            </button>
          ))}
        </div>
        <button onClick={handleAddCategory} className="w-full bg-green-600 text-white px-4 py-2 rounded-xl font-bold">+ Qo'shish</button>
      </div>

      <div className="max-w-md space-y-2">
        {categoriesList.map((c) => (
          <div key={c.id} className="bg-white border rounded-xl p-3">
            {editingId === c.id ? (
              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border p-2 rounded-xl bg-white text-black"
                  />
                  <input
                    type="number"
                    placeholder="Tartib #"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(e.target.value)}
                    className="w-24 border p-2 rounded-xl bg-white text-black"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Rasm URL (ixtiyoriy)"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full border p-2 rounded-xl bg-white text-black mb-3"
                />
                <p className="text-xs text-gray-500 mb-2">Ikonka:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {SUGGESTED_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setEditIcon(icon)}
                      className={`w-9 h-9 rounded-lg text-lg border ${editIcon === icon ? "border-green-600 bg-green-50" : "border-gray-200 bg-white"}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm disabled:opacity-60">
                    {saving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                  <button onClick={cancelEdit} className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold text-sm">
                    Bekor qilish
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {c.sort_order != null && (
                    <span className="text-xs font-bold text-gray-400 w-5 text-right">{c.sort_order}</span>
                  )}
                  <span className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center text-2xl bg-gray-50 flex-shrink-0">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.icon || "📦"
                    )}
                  </span>
                  <span className="text-black font-semibold">{c.name}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => startEdit(c)} className="text-blue-600 text-sm font-bold underline">
                    Tahrirlash
                  </button>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 text-sm font-bold underline">
                    O'chirish
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}