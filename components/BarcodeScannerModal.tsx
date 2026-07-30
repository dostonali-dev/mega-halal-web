"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onScan: (code: string) => void;
  onClose: () => void;
};

// Admin panelda mahsulot qidirish uchun - kamera orqali mahsulot barkodini
// (shtrix-kodini) o'qib, uni avtomatik qidiruv katagiga qo'yadi.
// html5-qrcode kutubxonasi orqali ishlaydi (getUserMedia asosida, brauzerda
// ham, native ilova ichidagi WebView'da ham ishlaydi - lekin native ilovada
// ishlashi uchun Info.plist/AndroidManifest'da kamera ruxsati kerak bo'ladi).
export default function BarcodeScannerModal({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode("barcode-reader-view", {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        } as any);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            // Shtrix-kod (barkod) keng va past bo'lgani uchun qrbox ham
            // shunga mos - kengroq va pastroq qilib beriladi.
            qrbox: { width: 280, height: 120 },
            // Kamera past aniqlikda ochilsa, telefonni juda yaqin olib
            // bormasa kod o'qilmay qolardi - shu sabab yuqori aniqlik
            // so'raymiz, shunda odatiy masofadan ham o'qiy oladi.
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          (decodedText: string) => {
            if (stoppedRef.current) return;
            stoppedRef.current = true;
            onScan(decodedText.trim());
          },
          () => {
            // Har bir kadrda kod topilmasa shu yerga tushadi - doimiy holat,
            // xatolik sifatida ko'rsatilmaydi.
          }
        );
      } catch (e: any) {
        console.error("Barkod skaner xatoligi:", e);
        setError("Kameraga ruxsat berilmadi yoki kamera topilmadi.");
      }
    })();

    return () => {
      cancelled = true;
      stoppedRef.current = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <button
        onClick={onClose}
        aria-label="Yopish"
        className="absolute right-4 z-10 bg-white/10 text-white rounded-full w-11 h-11 flex items-center justify-center text-2xl"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        ×
      </button>

      <p className="text-white font-semibold mb-4 text-center">
        📷 Mahsulot barkodini kameraga to'g'rilang
      </p>

      <div
        id="barcode-reader-view"
        className="w-full max-w-sm rounded-2xl overflow-hidden"
      />

      {error && (
        <p className="text-red-400 font-semibold text-center mt-4 max-w-sm">
          {error}
        </p>
      )}
    </div>
  );
}
