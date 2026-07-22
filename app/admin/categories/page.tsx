"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = { id: number; name: string };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error) setCategoriesList(data || []);
  };

  useEffect(() => {
    if (checkedLogin) loadCategories();
  }, [checkedLogin]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: newCategoryName.trim() });
    if (error) { alert("Xato: " + error.message); return; }
    setNewCategoryName("");
    loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Bu kategoriyani o'chirmoqchimisiz? Mavjud mahsulotlar o'zgarmaydi, faqat yangi mahsulot qo'shishda bu kategoriya ro'yxatda ko'rinmay qoladi.")) return;
    await supabase.from("categories").delete().eq("id", id);
    loadCategories();
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <Link href="/admin" className="text-green-700 font-semibold">← Menyu</Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">Kategoriyalar</h1>

      <div className="max-w-md bg-gray-50 border rounded-xl p-4">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Yangi kategoriya nomi"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 border p-2 rounded-xl bg-white text-black"
          />
          <button onClick={handleAddCategory} className="bg-green-600 text-white px-4 rounded-xl font-bold">+ Qo'shish</button>
        </div>
        <div className="space-y-2">
          {categoriesList.map((c) => (
            <div key={c.id} className="bg-white border rounded-xl p-3 flex items-center justify-between">
              <span className="text-black font-semibold">{c.name}</span>
              <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 text-sm font-bold underline">O'chirish</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}