"use client";

import { useEffect } from "react";

const VERSION_KEY = "mhs_app_version";

// Native ilova (Capacitor) saytni faqat ochilganda bir marta yuklaydi va
// keyin fonda uzoq vaqt "tirik" turadi - foydalanuvchi ilovani yopib-ochib
// yursa ham WebView eski sahifani ko'rsatishda davom etishi mumkin, hatto
// saytga yangi tuzatish chiqarilgan bo'lsa ham. Bu komponent ilova har safar
// oldinga chiqqanda (resume/focus) serverdagi joriy versiyani tekshiradi va
// farq bo'lsa sahifani majburan qayta yuklaydi - shunda foydalanuvchilar
// doim eng so'nggi tuzatilgan versiyani ko'radi, qo'lda kesh tozalash yoki
// ilovani qayta o'rnatish shart bo'lmaydi.
export default function AppUpdateChecker() {
  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.version || data.version === "dev") return;

        const stored = localStorage.getItem(VERSION_KEY);
        if (stored && stored !== data.version) {
          localStorage.setItem(VERSION_KEY, data.version);
          window.location.reload();
          return;
        }
        if (!stored) {
          localStorage.setItem(VERSION_KEY, data.version);
        }
      } catch {
        // Internet vaqtincha yo'q bo'lsa ham ilova ishlashda davom etsin -
        // versiya tekshiruvi shunchaki keyingi safar qayta urinadi.
      }
    };

    checkForUpdate();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", checkForUpdate);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);

  return null;
}
