"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

export default function PhonePage() {
  const { user, updatePhone } = useAuth();
  const { t } = useLanguage();
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSave = async () => {
    const digits = newPhone.replace(/\D/g, "");
    if (digits.length < 10) { setMessage({ type: "error", text: t("phone_invalid") }); return; }
    setSaving(true);
    const error = await updatePhone(newPhone);
    setSaving(false);
    if (error) { setMessage({ type: "error", text: error }); return; }
    setMessage({ type: "success", text: t("phone_success") });
    setNewPhone("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`📱 ${t("profile_menu_phone")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-gray-500">Hozirgi: <span className="font-bold text-black">{user?.phone}</span></p>
          <input
            type="text"
            placeholder={t("phone_new")}
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full border rounded-xl p-3 text-black"
          />
          {message && (
            <p className={`text-sm font-semibold ${message.type === "error" ? "text-red-500" : "text-green-700"}`}>
              {message.text}
            </p>
          )}
          <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
            {saving ? t("phone_saving") : t("phone_save")}
          </button>
        </div>
      </div>
    </main>
  );
}
