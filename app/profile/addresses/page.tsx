"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/imageCompress";
import { fetchAddresses, addAddress, updateAddress, setDefaultAddress, deleteAddress, type Address } from "@/lib/addresses";
import { useLanguage } from "@/lib/LanguageContext";
import AddressSearchModal from "@/components/AddressSearchModal";
import PageHeader from "@/components/PageHeader";

export default function AddressesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [addressMode, setAddressMode] = useState<"form" | "photo">("form");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [addressImageFile, setAddressImageFile] = useState<File | null>(null);
  const [addressImagePreview, setAddressImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

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

  const resetForm = () => {
    setAddress("");
    setAddressDetail("");
    setAddressImageFile(null);
    setAddressImagePreview("");
    setAddressMode("form");
    setShowForm(false);
    setEditingAddress(null);
  };

  const startEdit = (a: Address) => {
    setEditingAddress(a);
    setAddressMode(a.address_image ? "photo" : "form");
    setAddress(a.address || "");
    setAddressDetail(a.address_detail || "");
    setAddressImageFile(null);
    setAddressImagePreview(a.address_image || "");
    setShowForm(true);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (addressMode === "form" && !address.trim()) { alert(t("alert_enter_address")); return; }
    if (addressMode === "photo" && !addressImageFile && !(editingAddress && editingAddress.address_image)) {
      alert(t("alert_enter_address_photo"));
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | null = editingAddress?.address_image ?? null;
      if (addressMode === "photo" && addressImageFile) {
        const fileName = `profile-address-${user.id}-${Date.now()}.jpg`;
        const compressedFile = await compressImage(addressImageFile);
        const { error: uploadError } = await supabase.storage.from("receipts").upload(fileName, compressedFile);
        if (uploadError) {
          alert(t("alert_generic_error") + ": " + uploadError.message);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      const fields = {
        address: addressMode === "form" ? address : null,
        address_detail: addressMode === "form" ? addressDetail : null,
        address_image: addressMode === "photo" ? imageUrl : null,
      };

      if (editingAddress) {
        const error = await updateAddress(editingAddress.id, fields);
        if (error) {
          alert(t("alert_generic_error") + ": " + error.message);
        } else {
          resetForm();
          await loadAddresses();
        }
      } else {
        const isFirstAddress = addresses.length === 0;
        const { error } = await addAddress(user.id, fields, isFirstAddress);
        if (error) {
          alert(t("alert_generic_error") + ": " + error.message);
        } else {
          resetForm();
          await loadAddresses();
        }
      }
    } catch (e) {
      console.error(e);
      alert(t("alert_generic_error"));
    }
    setSaving(false);
  };

  const handleSetDefault = async (id: number) => {
    if (!user) return;
    await setDefaultAddress(user.id, id);
    await loadAddresses();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("confirm_delete_address"))) return;
    const error = await deleteAddress(id);
    if (error) {
      alert(t("alert_generic_error") + ": " + error.message);
      return;
    }
    await loadAddresses();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`📍 ${t("profile_menu_addresses")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-4">
          {loadingAddresses && <p className="text-gray-400 text-sm">{t("orders_loading")}</p>}

          <div className="space-y-3 mb-3">
            {addresses.map((a) => (
              <div
                key={a.id}
                className={`border rounded-xl p-3 ${a.is_default ? "border-green-600 bg-green-50" : "border-gray-200"}`}
              >
                {a.is_default && (
                  <span className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                    ✅ {t("checkout_default_badge")}
                  </span>
                )}
                {a.address_image ? (
                  <>
                    <p className="text-sm text-black mb-1">{t("address_via_photo")}</p>
                    <img src={a.address_image} alt="manzil" className="w-full rounded-lg border mb-2" />
                  </>
                ) : (
                  <p className="text-sm text-black mb-2">
                    {a.address}
                    {a.address_detail ? `, ${a.address_detail}` : ""}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => startEdit(a)} className="text-xs font-bold text-blue-600 underline">
                    {t("address_edit")}
                  </button>
                  {!a.is_default && (
                    <button onClick={() => handleSetDefault(a.id)} className="text-xs font-bold text-green-700 underline">
                      {t("address_set_default")}
                    </button>
                  )}
                  <button onClick={() => handleDelete(a.id)} className="text-xs font-bold text-red-500 underline ml-auto">
                    {t("address_delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!showForm && (
            <button onClick={() => setShowForm(true)} className="w-full border-2 border-dashed border-green-300 text-green-700 py-3 rounded-xl font-bold">
              {t("address_add_new")}
            </button>
          )}

          {showForm && (
            <div className="border-t pt-3 mt-1">
              {editingAddress && (
                <p className="text-xs font-bold text-blue-600 mb-2">✏️ {t("address_edit")}</p>
              )}
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
                    <input type="text" placeholder={t("checkout_address_placeholder")} value={address} readOnly className="flex-1 border rounded-xl p-3 text-black bg-white" />
                    <button type="button" onClick={() => setShowAddressSearch(true)} className="bg-blue-600 text-white px-4 rounded-xl">{t("checkout_search_button")}</button>
                  </div>
                  <input
                    type="text"
                    placeholder={t("checkout_detail_placeholder")}
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full border rounded-xl p-3 text-black bg-white mb-2"
                  />
                </>
              ) : (
                <div className="border-2 border-dashed rounded-xl p-4 text-center bg-green-50 mb-2">
                  <p className="text-sm text-gray-600 mb-2">{t("address_upload_instruction")}</p>
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
                <button onClick={handleSaveAddress} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
                  {saving ? t("address_saving") : t("address_save")}
                </button>
                <button onClick={resetForm} className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold">
                  {t("address_cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
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