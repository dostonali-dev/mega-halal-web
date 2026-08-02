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
    <>
      <EdgeSwipeBack />
      <AdminPushInit />
      {/* Barcha admin sahifalarida iOS notch/status bar ostida matn
          qolib ketmasligi uchun xavfsiz zona (safe-area) bo'shlig'i -
          PageHeader.tsx'da mijoz ilovasi uchun ishlatilgan yondashuv
          bilan bir xil. */}
      <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {children}
      </div>
    </>
  );
}