"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: number;
  message: string;
  image: string | null;
  link: string | null;
  active: boolean;
  created_at: string;
};

export default function AnnouncementAdminPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  const loadAnnouncements = async () => {
    const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (!error) setAnnouncements(data || []);
  };

  useEffect(() => {
    if (checkedLogin) loadAnnouncements();
  }, [checkedLogin]);

  const handleAdd = async () => {
    if (!message.trim()) {
      alert("Matnni kiriting!");
      return;
    }
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from("banners").upload(fileName, imageFile);
        if (uploadError) {
          alert("Rasm yuklanmadi: " + uploadError.message);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("banners").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("announcements").insert({
        message: message.trim(),
        image: imageUrl,
        link: link.trim() || null,
        active: false,
      });
      if (error) {
        alert("Xato: " + error.message);
        setSaving(false);
        return;
      }

      setMessage("");
      setLink("");
      setImageFile(null);
      setImagePreview("");
      await loadAnnouncements();
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    }
    setSaving(false);
  };

  const handleActivate = async (id: number) => {
    // Avval hammasini o'chiramiz, keyin faqat shuni yoqamiz
    await supabase.from("announcements").update({ active: false }).neq("id", 0);
    await supabase.from("announcements").update({ active: true }).eq("id", id);
    await loadAnnouncements();
  };

  const handleDeactivate = async (id: number) => {
    await supabase.from("announcements").update({ active: false }).eq("id", id);
    await loadAnnouncements();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu e'lonni o'chirmoqchimisiz?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    await loadAnnouncements();
  };

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <h1 className="text-3xl font-bold mt-3 mb-6">E'lon oynasi</h1>

      <div className="max-w-md bg-gray-50 border rounded-xl p-4 mb-8">
        <h2 className="font-bold text-black mb-3">Yangi e'lon</h2>

        <textarea
          placeholder="E'lon matni"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black mb-3"
          rows={3}
        />

        <input
          type="text"
          placeholder="Link (ixtiyoriy, masalan /categories/Chegirma)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black mb-3"
        />

        <div className="border-2 border-dashed rounded-xl p-4 text-center bg-white mb-3">
          <p className="text-sm text-gray-600 mb-2">📷 Rasm (ixtiyoriy)</p>
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

        <button
          onClick={handleAdd}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
        >
          {saving ? "Saqlanmoqda..." : "E'lon qo'shish"}
        </button>
      </div>

      <div className="max-w-md space-y-3">
        <h2 className="font-bold text-black text-lg">Mavjud e'lonlar ({announcements.length})</h2>
        {announcements.map((a) => (
          <div key={a.id} className={`bg-white border rounded-xl p-3 ${a.active ? "border-green-600" : ""}`}>
            {a.active && (
              <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                ✅ Faol (mijozlarga ko'rinmoqda)
              </span>
            )}
            {a.image && <img src={a.image} alt="e'lon" className="w-full h-32 object-cover rounded-lg mb-2" />}
            <p className="text-black text-sm mb-2 whitespace-pre-line">{a.message}</p>
            <div className="flex gap-2">
              {a.active ? (
                <button onClick={() => handleDeactivate(a.id)} className="text-sm font-bold text-gray-500 underline">
                  O'chirib qo'yish
                </button>
              ) : (
                <button onClick={() => handleActivate(a.id)} className="text-sm font-bold text-green-700 underline">
                  Faollashtirish
                </button>
              )}
              <button onClick={() => handleDelete(a.id)} className="text-sm font-bold text-red-500 underline ml-auto">
                O'chirish
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}