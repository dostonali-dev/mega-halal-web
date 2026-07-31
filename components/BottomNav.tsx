"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/CartContext";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function CategoriesIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </svg>
  );
}

function CartIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-1.5 9.5a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L4.6 4.6A1 1 0 0 0 3.6 3.8H2" />
      <circle cx="9" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.2-3.6 4.2-5.6 7.5-5.6s6.3 2 7.5 5.6" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const tabs = [
    { href: "/", key: "home", Icon: HomeIcon },
    { href: "/categories", key: "categories", Icon: CategoriesIcon },
    { href: "/search", key: "search", Icon: SearchIcon },
    { href: "/cart", key: "cart", Icon: CartIcon },
    { href: "/profile", key: "profile", Icon: ProfileIcon },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-green-100 flex justify-around items-center py-2 z-40"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.Icon;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            onClick={(e) => {
              // Foydalanuvchi allaqachon bosh sahifada bo'lsa-yu, "Bosh sahifa"
              // tugmasini yana bossa - sahifani qayta yuklamasdan, faqat
              // boshiga (yuqoriga) qaytaramiz.
              if (tab.key === "home" && pathname === "/") {
                e.preventDefault();
                window.dispatchEvent(new Event("mhs-home-tab-tap"));
              }
            }}
            className={`flex flex-col items-center px-3 py-1 relative ${active ? "text-green-600" : "text-gray-400"}`}
            aria-label={tab.key}
          >
            <span className="relative">
              <Icon active={active} />
              {tab.key === "cart" && itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
