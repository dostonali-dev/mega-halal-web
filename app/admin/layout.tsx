import type { Metadata, Viewport } from "next";
import EdgeSwipeBack from "@/components/EdgeSwipeBack";
import AdminPushInit from "@/components/AdminPushInit";

export const metadata: Metadata = {
  title: "Mega Halal Admin",
  manifest: "/admin-manifest.json",
};

// userScalable: false / maximumScale: 1 - admin ilovasida ekranni pinch
// (ikki barmoq) bilan zoom qilib, qotib qolish (X tugmasi tepaga chiqib
// ketadigan) bugini oldini oladi. Faqat /admin ostidagi sahifalarga
// tegishli - mijoz ilovasidagi rasmlarni zoom qilish imkoniyatiga
// ta'sir qilmaydi (root layout'dagi viewport o'zgarmagan).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2F7A52",
  userScalable: false,
  maximumScale: 1,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // "admin-page-shell" klassi globals.css'da ishlatiladi - shu klass
    // mavjud bo'lganda body'ning umumiy safe-area padding'i o'chiriladi
    // (aks holda pastdagi "sticky" panel bilan ikkalasi qo'shilib,
    // sahifa boshida ortiqcha bo'sh joy hosil bo'lardi).
    <div className="admin-page-shell">
      <EdgeSwipeBack />
      <AdminPushInit />
      {/* Barcha admin sahifalarida iOS notch/status bar ostida matn
          qolib ketmasligi uchun xavfsiz zona (safe-area). Oddiy padding
          skroll paytida kontent bilan birga surilib, sarlavha notch
          ustidan "o'tib" ko'rinib qolardi - shuning uchun bu blokni
          "sticky top-0" qilib, qattiq fon rangi bilan qo'yamiz: u
          qanchalik tez/qattiq skroll qilinmasin, doim notch ustida
          qotib turadi va ostidan hech narsa ko'rinmaydi. */}
      <div
        aria-hidden="true"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          height: "env(safe-area-inset-top, 0px)",
          backgroundColor: "#0a0a0a",
        }}
      />
      {children}
    </div>
  );
}