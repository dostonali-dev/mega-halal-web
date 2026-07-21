"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { supabase } from "@/lib/supabase";

const BANK_NAME = "농협은행";
const BANK_ACCOUNT = "352-1676-1060-43";
const BANK_HOLDER = "MUKHTAROV";

export default function CheckoutPage() {
  const router = useRouter();
  const { products, cart, total, clearCart } = useCart();
  const items = products.filter((p) => (cart[p.id] || 0) > 0);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [note, setNote] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

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
    if (!address.trim()) { alert("Manzilni kiriting!"); return; }
    if (!receiptFile) { alert("To'lov chekini yuklang!"); return; }

    setSubmitting(true);
    try {
      const orderText = items
        .map((p) => `${p.name} x ${cart[p.id]} = ${p.price * (cart[p.id] || 0)}₩`)
        .join("\n");

      const fullAddress = addressDetail ? `${address}, ${addressDetail}` : address;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_name: customerName,
          phone,
          address: fullAddress,
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
      const fileName = `${orderId}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, receiptFile);

      if (uploadError) {
        alert("Rasm yuklanmadi:\n" + JSON.stringify(uploadError));
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);

      await supabase
        .from("orders")
        .update({ receipt_image: urlData.publicUrl })
        .eq("id", orderId);

      await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderText,
          total,
          customerName,
          phone,
          address: fullAddress,
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
          <button
            onClick={() => router.push("/")}
            className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-bold"
          >
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
          <h2 className="font-bold text-black">Qabul qiluvchi va manzil</h2>
          <input type="text" placeholder="Ism" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
          <input type="text" placeholder="Telefon raqami" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
          <div className="flex gap-2">
            <input type="text" placeholder="Manzil" value={address} readOnly className="flex-1 border rounded-xl p-3 text-black" />
            <button type="button" onClick={openAddressSearch} className="bg-blue-600 text-white px-4 rounded-xl">🔍 Qidirish</button>
          </div>
          <input type="text" placeholder="Uy raqami, xonadon, qavat (101동 1203호)" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
          <textarea placeholder="Izoh" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-2">To'lov uchun bank hisob raqami</h2>
          <div className="p-3 bg-gray-100 rounded-xl">
            <p className="font-bold text-black">{BANK_NAME}</p>
            <p className="text-lg text-black">{BANK_ACCOUNT}</p>
            <p className="text-black">{BANK_HOLDER}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(BANK_ACCOUNT); alert("Hisob raqami nusxalandi"); }}
            className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl"
          >
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
              <button
                type="button"
                onClick={() => { setReceiptFile(null); setReceiptPreview(""); }}
                className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full"
              >✕</button>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-4 rounded-2xl text-lg font-bold mb-10"
        >
          {submitting ? "Yuborilmoqda..." : "Buyurtma berish"}
        </button>
      </div>
    </main>
  );
}