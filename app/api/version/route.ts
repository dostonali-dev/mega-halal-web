// Native ilova (Android/iOS) WebView'i saytni bir marta ochib, keyin fon
// rejimida uzoq vaqt ochiq turishi mumkin - shu payt yangi o'zgarishlar
// Vercel'ga chiqarilsa ham, ilova eski (keshdagi) versiyani ko'rsatishda
// davom etadi. Bu endpoint har deployda o'zgaradigan qiymat qaytaradi,
// shunda ilova "yangi versiya chiqibdi" deb bilib, avtomatik yangilanadi.
export const dynamic = "force-dynamic";

export async function GET() {
  const version =
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    "dev";

  return Response.json(
    { version },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
