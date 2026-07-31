"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import { fetchAddresses, addAddress, type Address } from "@/lib/addresses";
import { DELIVERY_FEE, getDeliveryFee, getFreeShippingRemaining } from "@/lib/delivery";
import AddressSearchModal from "@/components/AddressSearchModal";
import PageHeader from "@/components/PageHeader";

const BANK_NAME = "농협은행";
const BANK_ACCOUNT = "352-1676-1060-43";
const BANK_HOLDER = "MUKHTAROV";

export default function CheckoutPage() {
  const router = useRouter();
  const { products, cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const items = products.filter((p) => (cart[p.id] || 0) > 0);
  const deliveryFee = getDeliveryFee(total);
  const freeShippingRemaining = getFreeShippingRemaining(total);
  const grandTotal = total + deliveryFee;

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  // Mehmon (login qilmagan) foydalanuvchi uchun ham "yangi manzil" formasi
  // boshidanoq ko'rinishi kerak - shuning uchun default "new" (null emas).
  // Aks holda mehmon uchun manzil formasi umuman chiqmay, faqat "izoh"
  // maydoni bilan buyurtma berib bo'lar edi (manzil talab qilinmasdan).
  const [selectedId, setSelectedId] = useState<number | "new" | null>("new");

  const [addressMode, setAddressMode] = useState<"form" | "photo">("form");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressImageFile, setAddressImageFile] = useState<File | null>(null);
  const [addressImagePreview, setAddressImagePreview] = useState("");
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [showAddressSearch, setShowAddressSearch] = useState(false);

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

  const validateStock = async (): Promise<string | null> => {
    const ids = items.map((i) => i.id);
    const { data, error } = await supabase.from("products").select("id, name, stock, in_stock").in("id", ids);
    if (error || !data) return t("alert_generic_error");

    for (const item of items) {
      const dbItem = data.find((d) => d.id === item.id);
      const qty = cart[item.id] || 0;
      if (!dbItem) continue;
      if (dbItem.in_stock === false) {
        return `"${dbItem.name}" — ${t("out_of_stock_label")}`;
      }
      if (dbItem.stock != null && dbItem.stock < qty) {
        return `"${dbItem.name}": ${dbItem.stock} / ${qty}`;
      }
    }
    return null;
  };

  const decrementStock = async () => {
    for (const item of items) {
      const qty = cart[item.id] || 0;
      if (qty <= 0) continue;
      const { data: current } = await supabase.from("products").select("stock").eq("id", item.id).single();
      const currentStock = current?.stock ?? 0;
      const newStock = Math.max(0, currentStock - qty);
      await supabase.from("products").update({ stock: newStock }).eq("id", item.id);
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) { alert(t("alert_cart_empty")); return; }
    if (!customerName.trim()) { alert(t("alert_enter_name")); return; }
    if (!phone.trim()) { alert(t("alert_enter_phone")); return; }
    if (selectedId === "new" && addressMode === "form" && !address.trim()) { alert(t("alert_enter_address")); return; }
    if (selectedId === "new" && addressMode === "photo" && !addressImageFile) { alert(t("alert_enter_address_photo")); return; }
    if (!receiptFile) { alert(t("alert_upload_receipt")); return; }

    setSubmitting(true);

    const stockError = await validateStock();
    if (stockError) {
      alert(stockError);
      setSubmitting(false);
      return;
    }

    try {
      const orderText = items.map((p) => `${p.name} x ${cart[p.id]} = ${p.price * (cart[p.id] || 0)}₩`).join("\n");

      let fullAddress = "";
      let addressMain = "";
      let addressDetailFinal = "";
      let addressImageUrl: string | null = null;

      if (selectedId === "new") {
        if (addressMode === "photo" && addressImageFile) {
          const fileName = `address-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage.from("receipts").upload(fileName, addressImageFile);
          if (uploadError) {
            alert(t("alert_generic_error") + ": " + uploadError.message);
            setSubmitting(false);
            return;
          }
          const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
          addressImageUrl = urlData.publicUrl;
          fullAddress = "Photo address";
          addressMain = "Rasm orqali (manzil rasmiga qarang)";
        } else {
          fullAddress = addressDetail ? `${address}, ${addressDetail}` : address;
          addressMain = address;
          addressDetailFinal = addressDetail;
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
            fullAddress = "Photo address";
            addressImageUrl = chosen.address_image;
            addressMain = "Rasm orqali (manzil rasmiga qarang)";
          } else {
            fullAddress = chosen.address_detail ? `${chosen.address}, ${chosen.address_detail}` : chosen.address || "";
            addressMain = chosen.address || "";
            addressDetailFinal = chosen.address_detail || "";
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
          address_main: addressMain,
          address_detail: addressDetailFinal,
          address_image: addressImageUrl,
          note,
          order_text: orderText,
          total: grandTotal,
        }])
        .select()
        .single();

      if (orderError || !orderData) {
        alert(t("alert_order_not_saved"));
        setSubmitting(false);
        return;
      }

      const orderId = orderData.id;

      // "Eng ko'p sotiladigan" / "eng ko'p sotib olingan" statistikasi uchun
      // har bir mahsulotni alohida qatorlarga yozib boramiz. Bu xatolik
      // bersa ham (masalan jadval hali yaratilmagan bo'lsa) buyurtmaning
      // o'zi muvaffaqiyatli qolishi kerak - shu sababli xatolik faqat log qilinadi.
      const orderItemsRows = items.map((p) => ({
        order_id: orderId,
        product_id: p.id,
        product_name: p.name,
        quantity: cart[p.id] || 0,
        price: p.price,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsRows);
      if (itemsError) console.error("order_items yozishda xatolik:", itemsError);

      await decrementStock();

      const receiptFileName = `${orderId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("receipts").upload(receiptFileName, receiptFile);
      if (uploadError) {
        alert(t("alert_generic_error") + ": " + uploadError.message);
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
          itemsTotal: total,
          deliveryFee,
          total: grandTotal,
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
      alert(t("alert_generic_error"));
    }
    setSubmitting(false);
  };

  if (orderNumber) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-green-600">{t("checkout_success_title")}</h2>
          <p className="mt-3 text-lg font-bold text-black">{t("checkout_success_order_no")} {orderNumber}</p>
          <p className="mt-4 text-black">{t("checkout_success_message")}</p>
          <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "#fef9c3" }}>
            <p className="font-medium" style={{ color: "#854d0e" }}>{t("checkout_success_note")}</p>
          </div>
          <button onClick={() => router.push("/")} className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-bold">
            {t("checkout_back_home")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-28">
      <PageHeader title={t("checkout_title")} />
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-2">{t("checkout_products")}</h2>
          {items.map((p) => (
            <div key={p.id} className="flex justify-between text-black border-b py-2">
              <span>{p.name} x {cart[p.id]}</span>
              <span>{(p.price * cart[p.id]).toLocaleString()}₩</span>
            </div>
          ))}
          <div className="flex justify-between text-gray-500 text-sm mt-2">
            <span>{t("checkout_products")}</span><span>{total.toLocaleString()}₩</span>
          </div>
          <div className="flex justify-between text-gray-500 text-sm mb-1">
            <span>🚚 {t("delivery_fee")}</span>
            <span>
              {deliveryFee === 0 ? (
                <>
                  <span className="line-through text-gray-300 mr-1">{DELIVERY_FEE.toLocaleString()}₩</span>
                  <span className="text-green-700 font-bold">0₩</span>
                </>
              ) : (
                `${deliveryFee.toLocaleString()}₩`
              )}
            </span>
          </div>
          {freeShippingRemaining > 0 && (
            <p className="text-xs font-semibold text-green-700 mb-1">
              {t("free_shipping_progress").replace("{amount}", `${freeShippingRemaining.toLocaleString()}₩`)}
            </p>
          )}
          <div className="flex justify-between font-bold text-green-700 mt-2 pt-2 border-t text-lg">
            <span>{t("cart_total")}</span><span>{grandTotal.toLocaleString()}₩</span>
          </div>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4 space-y-3">
          <h2 className="font-bold text-black">{t("checkout_recipient")}</h2>
          <input type="text" placeholder={t("checkout_name_placeholder")} value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
          <input type="text" placeholder={t("checkout_phone_placeholder")} value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-3">{t("checkout_delivery_address")}</h2>

          <div className="space-y-2 mb-3">
            {savedAddresses.map((a) => (
              <label key={a.id} className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${selectedId === a.id ? "border-green-600 bg-green-50" : "border-gray-200"}`}>
                <input type="radio" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} className="mt-1" />
                <div className="flex-1">
                  {a.is_default && <span className="inline-block bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{t("checkout_default_badge")}</span>}
                  {a.address_image ? (
                    <p className="text-sm text-black">📷 {t("checkout_upload_photo")}</p>
                  ) : (
                    <p className="text-sm text-black">{a.address}{a.address_detail ? `, ${a.address_detail}` : ""}</p>
                  )}
                </div>
              </label>
            ))}

            <label className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer ${selectedId === "new" ? "border-green-600 bg-green-50" : "border-gray-200"}`}>
              <input type="radio" checked={selectedId === "new"} onChange={() => setSelectedId("new")} className="mt-1" />
              <span className="text-sm font-bold text-black">{t("checkout_new_address")}</span>
            </label>
          </div>

          {selectedId === "new" && (
            <div className="border-t pt-3">
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setAddressMode("form")} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${addressMode === "form" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}>
                  {t("checkout_type_address")}
                </button>
                <button type="button" onClick={() => setAddressMode("photo")} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${addressMode === "photo" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-500"}`}>
                  {t("checkout_upload_photo")}
                </button>
              </div>

              {addressMode === "form" ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder={t("checkout_address_placeholder")} value={address} readOnly className="flex-1 border rounded-xl p-3 text-black" />
                    <button type="button" onClick={() => setShowAddressSearch(true)} className="bg-blue-600 text-white px-4 rounded-xl">{t("checkout_search_button")}</button>
                  </div>
                  <input type="text" placeholder={t("checkout_detail_placeholder")} value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className="w-full border rounded-xl p-3 text-black mb-2" />
                </>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-4 text-center bg-green-50 mb-2">
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
                {t("checkout_save_address_checkbox")}
              </label>
            </div>
          )}

          <textarea placeholder={t("checkout_note_placeholder")} value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded-xl p-3 text-black mt-3" />
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <h2 className="font-bold text-black mb-2">{t("checkout_bank_title")}</h2>
          <div className="p-3 bg-gray-100 rounded-xl">
            <p className="font-bold text-black">{BANK_NAME}</p>
            <p className="text-lg text-black">{BANK_ACCOUNT}</p>
            <p className="text-black">{BANK_HOLDER}</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(BANK_ACCOUNT); alert(t("checkout_copied")); }} className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl">
            {t("checkout_copy_account")}
          </button>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl p-4 mb-4">
          <p className="font-medium text-black mb-2">{t("checkout_receipt_title")}</p>
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
          {submitting ? t("checkout_submitting") : t("checkout_submit")}
        </button>
      </div>

      {showAddressSearch && (
        <AddressSearchModal
          onComplete={(addr) => setAddress(addr)}
          onClose={() => setShowAddressSearch(false)}
        />
      )}
    </main>
  );
}