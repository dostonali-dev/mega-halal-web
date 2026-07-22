export type Language = "uz" | "en" | "ru" | "ko";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
];

export const translations = {
  uz: {
    nav_home: "Bosh sahifa",
    nav_favorites: "Sevimli",
    nav_cart: "Savatcha",
    nav_profile: "Profil",
    nav_categories: "Kategoriya",
    profile_title: "Profil",
    profile_language: "Til",
    profile_addresses: "Manzillarim",
    profile_contact: "Biz bilan bog'lanish",
    profile_orders: "Buyurtmalarim",
    profile_signout: "Chiqish",
  },
  en: {
    nav_home: "Home",
    nav_favorites: "Favorites",
    nav_cart: "Cart",
    nav_profile: "Profile",
    nav_categories: "Categories",
    profile_title: "Profile",
    profile_language: "Language",
    profile_addresses: "My addresses",
    profile_contact: "Contact us",
    profile_orders: "My orders",
    profile_signout: "Sign out",
  },
  ru: {
    nav_home: "Главная",
    nav_favorites: "Избранное",
    nav_cart: "Корзина",
    nav_profile: "Профиль",
    nav_categories: "Категории",
    profile_title: "Профиль",
    profile_language: "Язык",
    profile_addresses: "Мои адреса",
    profile_contact: "Связаться с нами",
    profile_orders: "Мои заказы",
    profile_signout: "Выйти",
  },
  ko: {
    nav_home: "홈",
    nav_favorites: "즐겨찾기",
    nav_cart: "장바구니",
    nav_profile: "프로필",
    nav_categories: "카테고리",
    profile_title: "프로필",
    profile_language: "언어",
    profile_addresses: "내 주소",
    profile_contact: "문의하기",
    profile_orders: "내 주문",
    profile_signout: "로그아웃",
  },
} as const;

export type TranslationKey = keyof typeof translations.uz;