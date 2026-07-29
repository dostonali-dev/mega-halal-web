"use client";

import { useEffect } from "react";
import { pushModal, popModal } from "./modalStack";

// Modal/oynacha ochiq bo'lganda, o'zining yopish funksiyasini umumiy
// "modalStack"ka ro'yxatdan o'tkazadi. Android'ning jismoniy "orqaga"
// tugmasi bosilganda (bu BackButtonHandler.tsx orqali, @capacitor/app
// paketining "backButton" hodisasi yordamida ushlanadi) eng oxirgi ochilgan
// modal birinchi yopiladi, ilovadan chiqib ketish o'rniga.
export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    pushModal(onClose);
    return () => {
      popModal(onClose);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
