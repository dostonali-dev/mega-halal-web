"use client";

import { useRouter } from "next/navigation";

// Har bir ichki sahifada bir xil ko'rinishdagi "orqaga" shapka - Cupang
// uslubidagi strelka ikonka (matn yo'q), sahifa nomi bo'lsa markazda/yonida
// ko'rsatiladi. Yuqoridagi iOS status-bar bilan ustma-ust tushmasligi uchun
// safe-area-inset-top hisobga olinadi, va scroll qilinganda ham tepada
// qotib turadi (sticky).
export default function PageHeader({
  title,
  onBack,
}: {
  title?: string;
  onBack?: () => void;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
      style={{
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        backgroundColor: "rgba(10,10,10,0.85)",
        borderBottom: "1px solid #2a2a2a",
      }}
    >
      <button
        onClick={handleBack}
        aria-label="Orqaga"
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#1f1f1f" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>
      {title && (
        <h1 className="text-lg font-bold truncate" style={{ color: "#ffffff" }}>
          {title}
        </h1>
      )}
    </div>
  );
}
