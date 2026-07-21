"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { fetchAddresses, addAddress, type Address } from "@/lib/addresses";

const BANK_NAME = "농협은행";
const BANK_ACCOUNT = "352-1676-1060-43";
const BANK_HOLDER = "MUKHTAROV";

export default function CheckoutPage() {
  const router = useRouter();
  const { products, cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const items = products.filter((p) => (cart[p.id] || 0) > 0);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);

  const [addressMode, setAddressMode] = useState<"form" | "photo">("form");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressImageFile, setAddressImageFile] = useState<File | null>(null);
  const [addressImagePreview, setAddressImagePreview] = useState("");
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setCustomerName((prev) => prev || user.name);
    setPhone((prev) => prev || user.phone);

    fetchAddresses(user.id).then((list) => {
      setSavedAddresses(list);
      const def = list.find((a) => a.is_default);
      if (def) setSelectedId(def.id);
      else if (list.length > 0) setSelectedId(list[0].id);
      else setSelectedId("new");
    });
  }, [user]);

  const openAddressSearch = () => {
    new (window as any).daum.Postcode({
      oncomplete: function (data: any) {
        setAddress(data.address);
      },
    }).open();
  };

  const handleSubmit = async () => {
    if (items.length === 0) { alert("Savatcha bo'sh!"); return; }
    if (!customerName.trim()) { alert("Ismingizni kiriting!"); return; }
    if (!phone.trim()) { alert("Telefon raqamingizni kiriting!"); return; }
    if (selectedId === "new" && addressMode === "form" && !address.trim()) { alert("Manzilni kiriting!"); return; }
    if (selectedId === "new" && addressMode === "photo" && !addressImageFile) { alert("Manzil rasmini yuklang!"); return; }
    if (!receiptFile) { alert("To'lov chekini yuklang!"); return; }

    setSubmitting(true);
    try {
      const orderText = items
        .map((p) => `${p.name} x ${cart[p.id]} = ${p.price * (cart[p.id] || 0)}₩`)
        .join("\n");

      let fullAddress = "";
      let addressImageUrl: string | null = null;

      if (selectedId === "new") {
        if (addressMode === "photo" && addressImageFile) {
          const fileName = `address-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage.from("receipts").upload(fileName, addressImageFile);
          if (uploadError) {
            alert("Manzil rasmi yuklanmadi: " + uploadError.message);
            setSubmitting(false);
            return;
          }
          const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
          addressImageUrl = urlData.publicUrl;
          fullAddress = "Manzil rasm orqali yuborilgan";
        } else {
          fullAddress = addressDetail ? `${address}, ${addressDetail}` : address;
        }

        if (saveNewAddress && user) {
          await addAddress(
            user.id,
            {
              address: addressMode === "form" ? address : null,
              address_detail: addressMode === "form" ? addressDetail : null,
              address_image: addressMode === "photo" ? addressImageUrl : null,
            },
            savedAddresses.length === 0
          );
        }
      } else {
        const chosen = savedAddresses.find((a) => a.id === selectedId);
        if (chosen) {
          if (chosen.address_image) {
            fullAddress = "Manzil rasm orqali yuborilgan";
            addressImageUrl = chosen.address_image;
          } else {
            fullAddress = chosen.address_detail ? `${chosen.address}, ${chosen.address_detail}` : chosen.address || "";
          }
        }
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          user_id: user?.id || null,
          customer_name: customerName,
          phone,
          address: fullAddress,
          address_image: addressImageUrl,
          note,
          order_text: orderText,
          total,
        }])
        .select()
        .single();

      if (orderError || !orderData) {
        alert("Buyurtma saqlanmadi!");
        setSubmitting(false);
        return;
      }

      const orderId = orderData.id;
      const receiptFileName = `${orderId}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage.from("receipts").upload(receiptFileName, receiptFile);
      if (uploadError) {
        alert("Chek rasmi yuklanmadi:\n" + JSON.stringify(uploadError));
        setSubmitting(false);
        return;
      }

      const { data: receiptUrlData } = supabase.storage.from("receipts").getPublicUrl(receiptFileName);
      await supabase.from("orders").update({ receipt_image: receiptUrlData.publicUrl }).eq("id", orderId);

      await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderText,
          total,
          customerName,
          phone,
          address: fullAddress + (addressImageUrl ? ` (rasm: ${addressImageUrl})` : ""),
          note,
          orderNumber: orderId,
        }),
      });

      clearCart();
      setOrderNumber(String(orderId));
    } catch (e) {
      console.error(e);
      alert("Xatolik yuz berdi, qayta urinib ko'ring.");
    }
    setSubmitting(false);
  };

  if (orderNumber) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600">✅ Buyurtma qabul qilindi</h2>
          <p className="mt-3 text-lg font-bold text-black">Buyurtma № {orderNumber}</p>
          <p className="mt-4 text-black">Buyurtmangiz muvaffaqiyatli qabul qilindi.</p>
          <div className="mt-3 p-3 bg-yellow-100 rounded-xl">
            <p className="text-yellow-800 font-medium">⚠️ To'lov tasdiqlangach buyurtmangiz jo'natiladi.</p>
          </div>
          <button onClick={() => router.push("/")} className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-bold">
            Bosh sahifaga qaytish
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">← Orqaga</button>
        <h1 className="text-2xl font-bold text-black mb-4">Buyurtmani rasmiylashtirish</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-2">Mahsulotlar</h2>
          {items.map((p) => (
            <div key={p.id} className="flex justify-between text-black border-b py-2">
              <span>{p.name} x {cart[p.id]}</span>
              <span>{(p.price * cart[p.id]).toLocaleString()}₩</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-green-700 mt-2 text-lg">
            <span>Jami</span><span>{total.toLocaleString()}₩</span>
          </div>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4 space-y-3">
          <h2 className="font-bold text-black">Qabul qiluvchi</h2>
          <input type="text" placeholder="Ism" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
          <input type="text" placeholder="Telefon raqami" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-3">Yetkazib berish manzili</h2>

          <div className="space-y-2 mb-3">
            {savedAddresses.map((a) => (
              <label
                key={a.id}
                className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${selectedId === a.id ? "border-green-600 bg-green-50" : "border-gray-200"}`}
              >
                <input
                  type="radio"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  {a.is_default && <span className="inline-block bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">Asosiy</span>}
                  {a.address_image ? (
                    <p className="text-sm text-black">📷 Rasm orqali yuborilgan manzil</p>
                  ) : (
                    <p className="text-sm text-black">{a.address}{a.address_detail ? `, ${a.address_detail}` : ""}</p>
                  )}
                </div>
              </label>
            ))}

            <label className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${selectedId === "new" ? "border-green-600 bg-green-50" : "border-gray-200"}`}>
              <input type="radio" checked={selectedId === "new"} onChange={() => setSelectedId("new")} className="mt-1" />
              <span className="text-sm font-bold text-black">+ Yangi manzil kiritish</span>
            </label>
          </div>

          {selectedId === "new" && (
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setAddressMode("form")} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${addressMode === "form" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}>
                  Manzilni yozish
                </button>
                <button type="button" onClick={() => setAddressMode("photo")} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${addressMode === "photo" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}>
                  Rasm yuklash
                </button>
              </div>

              {addressMode === "form" ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Manzil" value={address} readOnly className="flex-1 border rounded-xl p-3 text-black" />
                    <button type="button" onClick={openAddressSearch} className="bg-blue-600 text-white px-4 rounded-xl">🔍 Qidirish</button>
                  </div>
                  <input type="text" placeholder="Uy raqami, xonadon, qavat (101동 1203호)" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className="w-full border rounded-xl p-3 text-black mb-2" />
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

              <label className="flex items-center gap-2 text-sm text-black">
                <input type="checkbox" checked={saveNewAddress} onChange={(e) => setSaveNewAddress(e.target.checked)} />
                Shu manzilni keyingi safar uchun ham saqlash
              </label>
            </div>
          )}

          <textarea placeholder="Izoh" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded-xl p-3 text-black mt-3" />
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-2">To'lov uchun bank hisob raqami</h2>
          <div className="p-3 bg-gray-100 rounded-xl">
            <p className="font-bold text-black">{BANK_NAME}</p>
            <p className="text-lg text-black">{BANK_ACCOUNT}</p>
            <p className="text-black">{BANK_HOLDER}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(BANK_ACCOUNT); alert("Hisob raqami nusxalandi"); }} className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl">
            📋 Hisob raqamini nusxalash
          </button>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <p className="font-medium text-black mb-2">📷 To'lov chekini yuklang</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setReceiptFile(file);
              setReceiptPreview(URL.createObjectURL(file));
            }}
            className="w-full border rounded-xl p-2 bg-white text-black"
          />
          {receiptPreview && (
            <div className="mt-3 relative">
              <img src={receiptPreview} alt="receipt" className="w-full rounded-xl border" />
              <button type="button" onClick={() => { setReceiptFile(null); setReceiptPreview(""); }} className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full">✕</button>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-4 rounded-2xl text-lg font-bold mb-10">
          {submitting ? "Yuborilmoqda..." : "Buyurtma berish"}
        </button>
      </div>
    </main>
  );
}