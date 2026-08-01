"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

// Mijoz ilovasi (Capacitor native wrapper) uchun OneSignal push tizimini
// ishga tushiradi - "buyurtmangiz jo'natildi", "buyurtmangizga javob keldi"
// kabi bildirishnomalarni qabul qilish uchun. AdminPushInit'ning aynan
// o'zi kabi ishlaydi, lekin butunlay boshqa OneSignal ilovasi (App ID/REST
// kalit) bilan - chunki mijoz va admin ilovalari App Store'da alohida-alohida
// ilovalar (alohida bundle ID, alohida push sertifikat).
//
// Shu component root layout'ga qo'yilgan (barcha sahifalarda ishlaydi), lekin
// /admin ichida hech narsa qilmaydi - u yerda AdminPushInit allaqachon o'z
// (admin) OneSignal ilovasini ishga tushiradi, ikkalasi bir vaqtda ishlab
// ketmasligi kerak.
//
// Foydalanuvchi tizimga kirganda OneSignal.login(user.id) chaqiriladi - shu
// orqali kelajakda "shu foydalanuvchining buyurtmasiga javob yozildi" kabi
// FAQAT o'sha bitta odamga yuboriladigan (broadcast emas) push'lar mumkin
// bo'ladi (lib/onesignal.ts'dagi sendCustomerPush'ning externalUserId
// parametri orqali).
export default function CustomerPushInit() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const initialized = useRef(false);
  const loggedInUserId = useRef<string | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_CUSTOMER_APP_ID;
        if (!appId) {
          console.error("NEXT_PUBLIC_ONESIGNAL_CUSTOMER_APP_ID sozlanmagan.");
          return;
        }

        const OneSignalModule = await import("@onesignal/capacitor-plugin");
        const OneSignal = OneSignalModule.default;

        if (!initialized.current) {
          initialized.current = true;
          OneSignal.initialize(appId);
          await OneSignal.Notifications.requestPermission(true);

          OneSignal.Notifications.addEventListener("click", (event: any) => {
            try {
              const targetUrl = event?.notification?.additionalData?.url;
              if (targetUrl) router.push(targetUrl);
            } catch (e) {
              console.error("Push bosilganda yo'naltirishda xatolik:", e);
            }
          });
        }

        // Foydalanuvchi kirgan/chiqqanini OneSignal'ga bildiramiz - shu
        // orqali keyinchalik faqat shu odamga push yuborish mumkin bo'ladi.
        if (user?.id && loggedInUserId.current !== user.id) {
          loggedInUserId.current = user.id;
          await OneSignal.login(user.id);
        } else if (!user?.id && loggedInUserId.current) {
          loggedInUserId.current = null;
          await OneSignal.logout();
        }
      } catch (e) {
        console.error("OneSignal (mijoz) init xatoligi:", e);
      }
    })();
  }, [pathname, user, router]);

  return null;
}
