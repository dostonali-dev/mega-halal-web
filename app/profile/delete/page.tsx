"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";

export default function DeleteAccountPage() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const { t } = useLanguage();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setDeleting(true);
    const err = await deleteAccount();
    setDeleting(false);
    if (err) { setError(err); return; }
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <PageHeader title={`🗑️ ${t("delete_account_title")}`} />
      <div className="max-w-md mx-auto p-4 md:p-8">
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <p className="text-sm font-semibold" style={{ color: "#b91c1c" }}>{t("delete_account_warning")}</p>
        </div>
        <p className="text-sm text-black mb-2">{t("delete_account_type_instruction")}</p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          className="w-full border rounded-xl p-3 text-black mb-3"
        />
        {error && <p className="text-red-500 text-sm font-semibold mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white py-3 rounded-xl font-bold"
          >
            {deleting ? "..." : t("delete_account_button")}
          </button>
          <button onClick={() => router.back()} className="px-4 bg-gray-100 text-gray-600 rounded-xl font-bold">
            {t("delete_account_cancel")}
          </button>
        </div>
      </div>
    </main>
  );
}
