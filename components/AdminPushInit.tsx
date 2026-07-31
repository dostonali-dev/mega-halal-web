"use client";

import { useEffect } from "react";

// Admin ilovasi (Capacitor native wrapper) ochilganda OneSignal push
// tizimini ishga tushiradi - shu orqali "yangi buyurtma keldi" kabi
// bildirishnomalarni qabul qila oladi. Faqat native ilova ichida (web
// brauzerda emas) va faqat /admin bo'limida ishlaydi (shuning uchun
// app/admin/layout.tsx ichiga qo'yilgan, root layout emas).
export default function AdminPushInit() {
  useEffect(() => {
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_ADMIN_APP_ID;
        if (!appId) {
          console.error("NEXT_PUBLIC_ONESIGNAL_ADMIN_APP_ID sozlanmagan.");
          return;
        }

        const OneSignalModule = await import("@onesignal/capacitor-plugin");
        const OneSignal = OneSignalModule.default;

        OneSignal.initialize(appId);
        await OneSignal.Notifications.requestPermission(true);

        // Push bildirishnoma bosilganda, unda ko'rsatilgan sahifaga
        // (masalan /admin/orders) o'sha ilova ichida (webview'da) o'tadi -
        // yangi brauzer ochilmasdan, to'g'ridan-to'g'ri kerakli sahifaga.
        OneSignal.Notifications.addEventListener("click", (event: any) => {
          try {
            const targetUrl = event?.notification?.additionalData?.url;
            if (targetUrl) {
              window.location.href = targetUrl;
            }
          } catch (e) {
            console.error("Push bosilganda yo'naltirishda xatolik:", e);
          }
        });
      } catch (e) {
        console.error("OneSignal (admin) init xatoligi:", e);
      }
    })();
  }, []);

  return null;
}
