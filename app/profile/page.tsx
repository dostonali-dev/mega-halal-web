"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { fetchAddresses, addAddress, setDefaultAddress, deleteAddress, type Address } from "@/lib/addresses";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

const STORE_PHONE = "010-3943-2233";
const STORE_TELEGRAM = "https://t.me/megahalalsuppermarket";

type Order = {
  id: number;
  order_text: string;
  total: number;
  created_at: string;
  status?: string | null;
  payment_status?: string | null;
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [addressMode, setAddressMode] = useState<"form" | "photo">("form");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressImageFile, setAddressImageFile] = useState<File | null>(null);
  const [addressImagePreview, setAddressImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    const list = await fetchAddresses(user.id);
    setAddresses(list);
    setLoadingAddresses(false);
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setOrders(data);
      setLoadingOrders(false);
    };
    loadOrders();
  }, [user]);

  const openAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        setAddress(data.address);
      },
    }).open();
  };

  const resetForm = () => {
    setAddress("");
    setAddressDetail("");
    setAddressImageFile(null);
    setAddressImagePreview("");
    setAddressMode("form");
    setShowForm(false);
  };

  const handleAddAddress = async () => {
    if (!user) return;
    if (addressMode === "form" && !address.trim()) { alert("Manzilni kiriting!"); return; }
    if (addressMode === "photo" && !addressImageFile) { alert("Manzil rasmini yuklang!"); return; }

    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (addressMode === "photo" && addressImageFile) {
        const fileName = `profile-address-${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("receipts").upload(fileName, addressImageFile);
        if (uploadError) {
          alert("Rasm yuklanmadi: " + uploadError.message);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const isFirstAddress = addresses.length === 0;

      const { error } = await addAddress(
        user.id,
        {
          address: addressMode === "form" ? address : null,
          address_detail: addressMode === "form" ? addressDetail : null,
          address_image: addressMode === "photo" ? imageUrl : null,
        },
        isFirstAddress
      );

      if (error) {
        alert("Xatolik: " + error.message);
      } else {
        resetForm();
        await loadAddresses();
      }
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi.");
    }
    setSaving(false);
  };

  const handleSetDefault = async (id: number) => {
    if (!user) return;
    await setDefaultAddress(user.id, id);
    await loadAddresses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu manzilni o'chirmoqchimisiz?")) return;
    const error = await deleteAddress(id);
    if (error) {
      alert("O'chirishda xatolik: " + error.message);
      return;
    }
    await loadAddresses();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">👤 Profil</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <p className="text-lg font-bold text-black">{user?.name}</p>
              <p className="text-gray-500">{user?.phone}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-3">🌐 {t("profile_language")}</h2>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-2 justify-center py-2 rounded-xl text-sm font-bold border ${
                  language === lang.code ? "bg-green-600 text-white border-green-600" : "bg-white text-black border-gray-200"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-3">📍 Manzillarim</h2>

          {loadingAddresses && <p className="text-gray-400 text-sm">Yuklanmoqda...</p>}

          <div className="space-y-3 mb-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className={`border rounded-xl p-3 ${a.is_default ? "border-green-600 bg-green-50" : "border-gray-200"}`}
              >
                {a.is_default && (
                  <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                    ✅ Asosiy manzil
                  </span>
                )}
                {a.address_image ? (
                  <>
                    <p className="text-sm text-black mb-1">📷 Rasm orqali yuborilgan</p>
                    <img src={a.address_image} alt="manzil" className="w-full rounded-lg border mb-2" />
                  </>
                ) : (
                  <p className="text-sm text-black mb-2">
                    {a.address}
                    {a.address_detail ? `, ${a.address_detail}` : ""}
                  </p>
                )}
                <div className="flex gap-2">
                  {!a.is_default && (
                    <button
                      onClick={() => handleSetDefault(a.id)}
                      className="text-xs font-bold text-green-700 underline"
                    >
                      Asosiy qilib belgilash
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-xs font-bold text-red-500 underline ml-auto"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-green-300 text-green-700 py-3 rounded-xl font-bold"
            >
              + Yangi manzil qo'shish
            </button>
          )}

          {showForm && (
            <div className="border-t pt-3 mt-1">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setAddressMode("form")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border ${addressMode === "form" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}
                >
                  Manzilni yozish
                </button>
                <button
                  type="button"
                  onClick={() => setAddressMode("photo")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border ${addressMode === "photo" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}
                >
                  Rasm yuklash
                </button>
              </div>

              {addressMode === "form" ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Manzil" value={address} readOnly className="flex-1 border rounded-xl p-3 text-black" />
                    <button type="button" onClick={openAddressSearch} className="bg-blue-600 text-white px-4 rounded-xl">🔍 Qidirish</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Uy raqami, xonadon, qavat (101동 1203호)"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full border rounded-xl p-3 text-black mb-2"
                  />
                </>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-4 text-center bg-green-50 mb-2">
                  <p className="text-sm text-gray-600 mb-2">Manzil rasmini yuklang</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAddressImageFile(file);
                      setAddressImagePreview(URL.createObjectURL(file));
                    }}
                    className="w-full text-black"
                  />
                  {addressImagePreview && <img src={addressImagePreview} alt="manzil" className="mt-3 w-full rounded-xl border" />}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleAddAddress} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                <button onClick={resetForm} className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold">
                  Bekor qilish
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-3">📞 Biz bilan bog'lanish</h2>
          <a href={`tel:${STORE_PHONE}`} className="block bg-gray-100 rounded-xl p-3 text-black font-semibold mb-2">
            📱 {STORE_PHONE}
          </a>
          <a href={STORE_TELEGRAM} target="_blank" rel="noreferrer" className="block bg-blue-500 text-white rounded-xl p-3 text-center font-semibold">
            ✈️ Telegram kanalimiz
          </a>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-3">🧾 Buyurtmalarim</h2>

          {loadingOrders && <p className="text-gray-400 text-sm">Yuklanmoqda...</p>}
          {!loadingOrders && orders.length === 0 && <p className="text-gray-400 text-sm">Hali buyurtma yo'q</p>}

          <div className="space-y-3">
            {orders.map((o) => {
              const statusColors: Record<string, string> = {
                "✅ To'landi": "bg-green-100 text-green-700",
                "📦 Jo'natildi": "bg-blue-100 text-blue-700",
                "❌ Bekor qilindi": "bg-red-100 text-red-700",
              };
              const status = o.status || "⏳ Kutilmoqda";
              return (
                <div key={o.id} className="border rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-black">Buyurtma № {o.id}</span>
                    <span className="text-green-700 font-bold">{o.total.toLocaleString()}₩</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{new Date(o.created_at).toLocaleString("uz-UZ")}</p>
                  <div className="flex gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[status] || "bg-yellow-100 text-yellow-700"}`}>
                      {status}
                    </span>
                    {o.payment_status && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        💳 {o.payment_status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-black whitespace-pre-line">{o.order_text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={signOut} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold">
          Chiqish
        </button>
      </div>
      <BottomNav />
    </main>
  );
}