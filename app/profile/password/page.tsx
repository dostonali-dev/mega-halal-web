"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    if (newPassword.length < 4) { setError(t("password_short")); return; }
    if (newPassword !== confirmPassword) { setError(t("password_mismatch")); return; }
    setSaving(true);
    const err = await updatePassword(newPassword);
    setSaving(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">{t("back")}</button>
        <h1 className="text-2xl font-bold text-black mb-6">🔒 {t("profile_menu_password")}</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-3">
          {error && <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 text-sm font-semibold p-3 rounded-xl">{t("password_success")}</div>}

          <input type="password" placeholder={t("password_new")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border rounded-xl p-3 text-black" />
          <input type="password" placeholder={t("password_confirm")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border rounded-xl p-3 text-black" />

          <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
            {saving ? t("password_saving") : t("password_save")}
          </button>
        </div>
      </div>
    </main>
  );
}