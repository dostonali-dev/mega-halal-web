"use client";

// Mahsulot rasmi ko'rsatiladigan har bir joyda ishlatiladigan umumiy
// komponent. Agar mahsulotning haqiqiy rasmi bo'lmasa (masalan, Excel'dan
// import qilingan mahsulotlarda), bo'sh joy yoki buzilgan rasm o'rniga
// "Rasmi tez kunda qo'yiladi" degan chiroyli placeholder ko'rsatiladi.

export default function ProductImage({
  image,
  alt,
  className,
  compact,
}: {
  image?: string | null;
  alt: string;
  className: string;
  // Kichik (masalan 64px dan kichik) joylarda matn sig'maydi - shunda
  // faqat ikonka ko'rsatiladi, "tez kunda" matni yozilmaydi.
  compact?: boolean;
}) {
  if (image) {
    return <img src={image} alt={alt} className={className} />;
  }
  return (
    <div className={`${className} flex flex-col items-center justify-center gap-1 text-center`} style={{ backgroundColor: "#f3f4f6" }}>
      <svg width={compact ? 16 : 22} height={compact ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M8.5 5 10 3h4l1.5 2" />
      </svg>
      {!compact && (
        <span className="text-[9px] font-semibold leading-tight px-1" style={{ color: "#9ca3af" }}>
          Rasmi tez kunda qo'yiladi
        </span>
      )}
    </div>
  );
}
