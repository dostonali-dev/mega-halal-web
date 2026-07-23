"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

function isValidKoreanPhone(v: string) {
  return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(v.trim());
}

export default function ChangePhonePage() {
  const router = useRouter();
  const { user, updatePhone } = useAuth();
  const { t } = useLanguage();
  const [newPhone, setNewPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    if (!isValidKoreanPhone(newPhone)) { setError(t("phone_invalid")); return; }
    setSaving(true);
    const err = await updatePhone(newPhone.trim());
    setSaving(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setNewPhone("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">{t("back")}</button>
        <h1 className="text-2xl font-bold text-black mb-2">📱 {t("profile_menu_phone")}</h1>
        <p className="text-sm text-gray-500 mb-6">{user?.phone}</p>

        <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-3">
          {error && <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 text-sm font-semibold p-3 rounded-xl">{t("phone_success")}</div>}

          <input type="text" placeholder={t("phone_new")} value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full border rounded-xl p-3 text-black" />

          <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
            {saving ? t("phone_saving") : t("phone_save")}
          </button>
        </div>
      </div>
    </main>
  );
}