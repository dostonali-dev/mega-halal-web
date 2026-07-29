"use client";

import { useEffect } from "react";

// Android telefonlarda pastdagi jismoniy "orqaga" tugmasi bosilganda,
// ekranda modal/oynacha (masalan manzil qidirish, rasm kattalashtirish)
// ochiq bo'lsa, Capacitor uni yopish o'rniga to'g'ridan-to'g'ri ilovadan
// chiqib ketardi - chunki bizning modal shunchaki React state bo'lib,
// brauzer tarixida (history) alohida qadam hisoblanmas edi.
//
// Bu hook modal ochilganda brauzer tarixiga bitta "soxta" qadam qo'shadi.
// Orqaga tugmasi bosilganda o'sha qadam "yeyiladi" (popstate hodisasi
// chaqiriladi) - biz shuni ushlab, ilovadan chiqish o'rniga modalni
// yopamiz. Agar foydalanuvchi modalni o'zining "Yopish" tugmasi orqali
// yopsa, ortiqcha qo'shilgan tarix qadamini o'zimiz tozalab qo'yamiz.
export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ mhsModal: true }, "");

    const handlePopState = () => {
      onClose();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if ((window.history.state as any)?.mhsModal) {
        window.history.back();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
