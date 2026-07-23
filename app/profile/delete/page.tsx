"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    const err = await deleteAccount();
    setDeleting(false);
    if (err) { setError(err); return; }
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-700 font-semibold mb-4">{t("back")}</button>
        <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ {t("delete_account_title")}</h1>

        <div className="bg-white border border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-600 font-semibold mb-4">{t("delete_account_warning")}</p>

          {error && <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{error}</div>}

          <p className="text-sm text-black mb-2">{t("delete_account_type_instruction")}</p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full border rounded-xl p-3 text-black mb-4"
          />

          <button
            onClick={handleDelete}
            disabled={confirmText.trim().toUpperCase() !== "DELETE" || deleting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-3 rounded-xl font-bold mb-2"
          >
            {deleting ? "..." : t("delete_account_button")}
          </button>
          <button onClick={() => router.back()} className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">
            {t("delete_account_cancel")}
          </button>
        </div>
      </div>
    </main>
  );
}