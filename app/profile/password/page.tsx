"use client";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

export default function PasswordPage() {
  const { updatePassword } = useAuth();
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSave = async () => {
    if (newPassword.length < 4) { setMessage({ type: "error", text: t("password_short") }); return; }
    if (newPassword !== confirmPassword) { setMessage({ type: "error", text: t("password_mismatch") }); return; }
    setSaving(true);
    const error = await updatePassword(newPassword);
    setSaving(false);
    if (error) { setMessage({ type: "error", text: error }); return; }
    setMessage({ type: "success", text: t("password_success") });
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`🔒 ${t("profile_menu_password")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="bg-white border border-green-100 rounded-2xl p-4 space-y-3">
          <input
            type="password"
            placeholder={t("password_new")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-xl p-3 text-black"
          />
          <input
            type="password"
            placeholder={t("password_confirm")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-xl p-3 text-black"
          />
          {message && (
            <p className={`text-sm font-semibold ${message.type === "error" ? "text-red-500" : "text-green-700"}`}>
              {message.text}
            </p>
          )}
          <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold">
            {saving ? t("password_saving") : t("password_save")}
          </button>
        </div>
      </div>
    </main>
  );
}
