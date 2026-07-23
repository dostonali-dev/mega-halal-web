import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";
import { AuthProvider } from "@/lib/AuthContext";
import { FavoritesProvider } from "@/lib/FavoritesContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import AuthGate from "@/components/AuthGate";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mega Halal Supermarket",
  description: "Koreya bo'ylab Halal mahsulotlar yetkazib berish",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
     <script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        async
      ></script>
      <meta name="theme-color" content="#2F7A52" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <FavoritesProvider>
                <AuthGate>{children}</AuthGate>
              </FavoritesProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}