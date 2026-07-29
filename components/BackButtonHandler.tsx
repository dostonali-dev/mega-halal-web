"use client";

import { useEffect } from "react";
import { closeTopModal } from "@/lib/modalStack";

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
// 3. Aks holda (orqaga qaytish joyi ham yo'q) - ilovani yopadi (odatdagidek).
export default function BackButtonHandler() {
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
          } else {
            App.exitApp();
          }
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
    };
  }, []);

  return null;
}
