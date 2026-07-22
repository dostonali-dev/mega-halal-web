"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { t } = useLanguage();

  const tabs = [
    { href: "/", label: t("nav_home"), icon: "🏠" },
    { href: "/favorites", label: t("nav_favorites"), icon: "❤️" },
    { href: "/cart", label: t("nav_cart"), icon: "🛒" },
    { href: "/profile", label: t("nav_profile"), icon: "👤" },
    { href: "/categories", label: t("nav_categories"), icon: "📂" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 flex justify-around py-2 z-40">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center px-2 py-1 relative ${
              active ? "text-green-700" : "text-gray-400"
            }`}
          >
            <span className="text-xl relative">
              {tab.icon}
              {tab.href === "/cart" && itemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold mt-0.5">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}