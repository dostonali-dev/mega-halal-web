import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Server tomonida (masalan yangi buyurtma kelganda) admin ilovasiga
// push bildirishnoma yuborish uchun. Faqat backend/API route ichida
// ishlatiladi - REST API kaliti hech qachon brauzerga chiqmasligi kerak.
export async function sendAdminPush(title: string, message: string, url?: string) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_ADMIN_APP_ID;
  const restApiKey = process.env.ONESIGNAL_ADMIN_REST_API_KEY;

  if (!appId || !restApiKey) {
    console.error("OneSignal (admin) sozlanmagan - push yuborilmadi.");
    return;
  }

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        included_segments: ["Total Subscriptions"],
        headings: { en: title },
        contents: { en: message },
        // "url" - push bosilganda ochiladigan sahifa. Bu native ilova
        // ichida (webview'da) o'sha sahifaga o'tkazadi.
        ...(url ? { data: { url } } : {}),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("OneSignal push xatoligi:", data);
    }
  } catch (e) {
    // Push yuborilmasa ham, buyurtmaning o'zi to'xtab qolmasligi kerak -
    // shuning uchun xatolikni faqat log qilamiz, throw qilmaymiz.
    console.error("OneSignal push so'rovida xatolik:", e);
  }
}

// Mijoz (customer) ilovasiga push yuborish uchun - alohida OneSignal
// ilovasi (mijoz ilovasi uchun App Store'da alohida bundle bo'lgani sabab,
// admin ilovasidan butunlay boshqa OneSignal App ID/REST kalit kerak).
//
// externalUserId berilsa - faqat o'sha bitta foydalanuvchiga (masalan
// buyurtmasiga javob yozilganda) yuboriladi; berilmasa - barcha
// obunachilarga (masalan admin panelidan yuboriladigan umumiy xabar uchun).
// Natija qaytaradi - shunda uni chaqirgan API route xatolikni
// (masalan env o'zgaruvchi yo'q yoki OneSignal rad etdi) mijozga/adminga
// ko'rsata oladi, aks holda xatolik "yutilib" ketib, chaqiruvchi tomon
// hech narsa bo'lmagandek "muvaffaqiyatli" deb o'ylayveradi.
export async function sendCustomerPush(
  title: string,
  message: string,
  opts?: { url?: string; externalUserId?: string | null }
): Promise<{ success: boolean; error?: string; details?: unknown }> {
  // Xabarni "customer_notifications" jadvaliga yozib qo'yamiz - shunda
  // mijoz ilovaning "Bildirishnomalar" bo'limida buni ko'ra oladi (push
  // o'zi ba'zan qurilma sozlamalari sabab kelmasligi mumkin, lekin ilova
  // ichidagi ro'yxatda xabar baribir saqlanib qoladi). target_user_id
  // bo'sh bo'lsa - bu barcha mijozlarga umumiy e'lon degani.
  try {
    await supabaseAdmin.from("customer_notifications").insert({
      title,
      message,
      url: opts?.url || null,
      target_user_id: opts?.externalUserId || null,
    });
  } catch (e) {
    console.error("customer_notifications'ga yozishda xatolik:", e);
  }

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_CUSTOMER_APP_ID;
  const restApiKey = process.env.ONESIGNAL_CUSTOMER_REST_API_KEY;

  if (!appId || !restApiKey) {
    const msg = "OneSignal (mijoz) sozlanmagan - NEXT_PUBLIC_ONESIGNAL_CUSTOMER_APP_ID yoki ONESIGNAL_CUSTOMER_REST_API_KEY topilmadi (server muhitida).";
    console.error(msg);
    return { success: false, error: msg };
  }

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: "push",
        headings: { en: title },
        contents: { en: message },
        ...(opts?.url ? { data: { url: opts.url } } : {}),
        ...(opts?.externalUserId
          ? { include_aliases: { external_id: [opts.externalUserId] } }
          : { included_segments: ["Total Subscriptions"] }),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("OneSignal (mijoz) push xatoligi:", data);
      return { success: false, error: data?.errors?.[0] || JSON.stringify(data), details: data };
    }
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      // OneSignal ba'zan 200 qaytaradi, lekin "errors" massivida sabab bo'ladi
      // (masalan "All included players are not subscribed").
      console.error("OneSignal (mijoz) qisman xatolik:", data);
      return { success: false, error: data.errors[0], details: data };
    }
    return { success: true, details: data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("OneSignal (mijoz) push so'rovida xatolik:", e);
    return { success: false, error: msg };
  }
}
