"use client";

import { useEffect, useRef, useState } from "react";
import { useBackButtonClose } from "@/lib/useBackButtonClose";

// Daum Postcode'ni popup oyna (window.open) sifatida emas, shu komponent
// ichida "embed" rejimida ko'rsatadi. Popup usuli iPhone Safari'da
// blokirovka qilinar edi ("팝업을 열 수 없습니다..."), Android ilovada esa
// popup to'g'ri ochilmay, orqaga qaytish imkoni yo'qolib qolardi.
// Embed rejimi - oddiy sahifa ichidagi elementga chizadi, shu sababli hech
// qanday popup-bloklovchi unga ta'sir qilmaydi va biz o'zimiz "Yopish"
// tugmasini qo'shib, doim ortga qaytish imkonini beramiz.
export default function AddressSearchModal({
  onComplete,
  onClose,
}: {
  onComplete: (address: string) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Bu komponent mount qilinganining o'zi "modal ochiq" degani - Android
  // "orqaga" tugmasi bosilganda ilovadan chiqib ketish o'rniga shu modal
  // yopilishi uchun.
  useBackButtonClose(true, onClose);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    // "daum" skripti sahifada "async" bilan yuklangani uchun, modal
    // ochilgan payt hali tayyor bo'lmasligi mumkin - shu sababli bir necha
    // marta qayta tekshiramiz, darrov "yo'q" deb hisoblamaymiz.
    const tryEmbed = () => {
      if (cancelled) return;
      const daum = (window as any).daum;
      if (daum && containerRef.current) {
        const postcode = new daum.Postcode({
          oncomplete: (data: any) => {
            onComplete(data.address);
            onClose();
          },
          width: "100%",
          height: "100%",
        });
        postcode.embed(containerRef.current);
        return;
      }
      attempts += 1;
      if (attempts > 40) {
        setLoadFailed(true);
        return;
      }
      setTimeout(tryEmbed, 250);
    };

    tryEmbed();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl overflow-hidden flex flex-col" style={{ height: "min(85vh, 600px)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <p className="font-bold text-black">📍 Manzilni qidirish</p>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-black font-bold flex items-center justify-center"
            aria-label="Yopish"
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} className="flex-1 min-h-0 relative">
          {loadFailed && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <p className="text-black">
                Manzil qidiruvi yuklanmadi. Internetni tekshirib, qaytadan urinib ko'ring.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
