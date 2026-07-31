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
