"use client";

import { useEffect } from "react";

// iOS/Android'da status-bar (soat, batareya, old kamera/notch turgan joy)
// veb-sahifa kontenti bilan ustma-ust tushib ketmasligi uchun.
//
// Avval bu faqat CSS'dagi `env(safe-area-inset-top)` orqali hal qilingan
// edi, lekin bu native WKWebView'da har doim ham to'liq ishonchli
// ishlamas ekan (ayrim sahifalarda kontent haligacha kamera tomonga
// borib qolayotgani kuzatildi). Shu sababli endi Capacitor'ning
// "StatusBar" plagini orqali, native darajada "statusBar veb-view ustiga
// yotmasin" deb aniq buyuriladi - bu Coupang kabi ilovalardagi kabi,
// tepada doim bo'sh, veb-kontent tegmaydigan joy qoldiradi.
export default function StatusBarInit() {
  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { StatusBar, Style } = await import("@capacitor/status-bar");
        // "overlay: false" - statusBar veb-sahifa ustiga "shaffof" bo'lib
        // yotmaydi, aksincha o'ziga alohida joy egallaydi va veb-kontent
        // shu joydan pastroqdan boshlanadi.
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0a0a0a" });
      } catch (e) {
        console.error("StatusBar init xatoligi:", e);
      }
    })();
  }, []);

  return null;
}
