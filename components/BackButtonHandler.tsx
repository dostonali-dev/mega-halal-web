"use client";

import { useEffect, useRef, useState } from "react";
import { closeTopModal } from "@/lib/modalStack";

const EXIT_WINDOW_MS = 2000;

// Android'ning pastdagi jismoniy "orqaga" tugmasi Capacitor'da to'g'ri
// ishlashi uchun @capacitor/app paketi orqali "backButton" hodisasini
// eshitish shart - aks holda Capacitor ilovani to'g'ridan-to'g'ri
// yopib/chiqarib yuborishi mumkin (sof window.history.pushState/popstate
// yetarli emas ekan, tekshirilgan real holatlarda ham shunday chiqqan).
//
// Bu komponent ilova ochilganda bir marta ishga tushadi va:
// 1. Agar bizning modallardan biri ochiq bo'lsa (modalStack) - avval o'shani
//    yopadi, ilovadan chiqmaydi.
// 2. Aks holda, agar sahifa tarixida orqaga qaytish joyi bo'lsa - shunga
//    o'tadi (masalan mahsulot sahifasidan bosh sahifaga).
// 3. Aks holda (ildiz sahifada, orqaga qaytish joyi yo'q) - ko'plab
//    ilovalardagidek, birinchi bosishda pastda "yana bir marta bosing"
//    degan yozuv chiqadi, ikkinchi marta 2 soniya ichida bosilsagina
//    ilova chindan yopiladi. Bu tasodifan bosilib ilova yopilib
//    qolmasligi uchun.
export default function BackButtonHandler() {
  const [showExitHint, setShowExitHint] = useState(false);
  const lastPressRef = useRef(0);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let removeListener: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (closeTopModal()) return;

          if (canGoBack) {
            window.history.back();
            return;
          }

          const now = Date.now();
          if (now - lastPressRef.current < EXIT_WINDOW_MS) {
            App.exitApp();
            return;
          }
          lastPressRef.current = now;
          setShowExitHint(true);
          if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = setTimeout(() => setShowExitHint(false), EXIT_WINDOW_MS);
        });
        if (cancelled) {
          handle.remove();
        } else {
          removeListener = () => handle.remove();
        }
      } catch (e) {
        console.error("BackButtonHandler init failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      removeListener?.();
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  if (!showExitHint) return null;

  return (
    <div
      className="fixed left-1/2 z-[100] -translate-x-1/2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg"
      style={{
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        backgroundColor: "rgba(0,0,0,0.85)",
        color: "#ffffff",
      }}
    >
      Chiqish uchun yana bir marta orqaga bosing
    </div>
  );
}
