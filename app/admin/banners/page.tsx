"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Banner = {
  id: number;
  image: string;
  link: string | null;
  sort_order: number;
};

export default function BannersAdminPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [link, setLink] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") {
      router.push("/admin");
    } else {
      setCheckedLogin(true);
    }
  }, [router]);

  const loadBanners = async () => {
    const { data, error } = await supabase.from("banners").select("*").order("sort_order");
    if (!error) setBanners(data || []);
  };

  useEffect(() => {
    if (checkedLogin) loadBanners();
  }, [checkedLogin]);

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    router.push("/admin");
  };

  const handleAddBanner = async () => {
    if (!imageFile) {
      alert("Banner rasmini tanlang!");
      return;
    }
    setSaving(true);
    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from("banners").upload(fileName, imageFile);
      if (uploadError) {
        alert("Rasm yuklanmadi: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(fileName);

      const { error } = await supabase.from("banners").insert({
        image: urlData.publicUrl,
        link: link || null,
        sort_order: Number(sortOrder) || 0,
      });
      if (error) {
        alert("Xato: " + error.message);
        setSaving(false);
        return;
      }

      setImageFile(null);
      setImagePreview("");
      setLink("");
      setSortOrder("0");
      await loadBanners();
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu bannerni o'chirmoqchimisiz?")) return;
    await supabase.from("banners").delete().eq("id", id);
    loadBanners();
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <h1 className="text-4xl font-bold">Bannerlar</h1>
      <p className="mt-2 text-gray-500 text-sm">Bosh sahifada aylanib turadigan rasmlar</p>

      <div className="flex gap-3 mt-4 mb-6">
        <Link href="/admin" className="bg-green-600 text-white px-4 py-3 rounded-xl">⬅️ Mahsulotlar</Link>
        <Link href="/admin/orders" className="bg-blue-600 text-white px-4 py-3 rounded-xl">📦 Buyurtmalar</Link>
        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-3 rounded-xl">🚪 Chiqish</button>
      </div>

      <div className="max-w-md space-y-4 bg-gray-50 border rounded-xl p-4">
        <h2 className="font-bold text-black">Yangi banner qo'shish</h2>

        <div className="border-2 border-dashed rounded-xl p-4 text-center bg-white">
          <p className="text-sm text-gray-600 mb-2">📷 Banner rasmi (kenglik ~1200px tavsiya etiladi)</p>
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
          {imagePreview && <img src={imagePreview} alt="preview" className="mt-3 w-full rounded-xl border" />}
        </div>

        <input
          type="text"
          placeholder="Bosilganda ochiladigan link (ixtiyoriy, masalan /categories/Chegirma)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <input
          type="number"
          placeholder="Tartib raqami (kichik son oldinroq chiqadi)"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <button
          onClick={handleAddBanner}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
        >
          {saving ? "Saqlanmoqda..." : "Banner qo'shish"}
        </button>
      </div>

      <div className="mt-8 max-w-2xl space-y-3">
        <h2 className="font-bold text-black text-lg">Mavjud bannerlar ({banners.length})</h2>
        {banners.map((b) => (
          <div key={b.id} className="bg-white border rounded-xl p-3 flex items-center gap-3">
            <img src={b.image} alt="banner" className="w-24 h-14 object-cover rounded-lg border" />
            <div className="flex-1 text-sm text-gray-600">
              <p>Tartib: {b.sort_order}</p>
              {b.link && <p className="truncate">Link: {b.link}</p>}
            </div>
            <button onClick={() => handleDelete(b.id)} className="text-red-500 text-sm font-bold underline">
              O'chirish
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}