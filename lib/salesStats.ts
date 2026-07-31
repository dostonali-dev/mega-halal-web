import { supabase } from "./supabase";
import type { Product, Category } from "./CartContext";

// Har bir buyurtmada nechta va qaysi mahsulot sotib olinganini "order_items"
// jadvalidan o'qib, "eng ko'p sotiladigan" / "eng ko'p sotib olingan"
// bo'limlarini qurish uchun umumiy yordamchi funksiyalar.
//
// MUHIM: order_items jadvali Supabase'da quyidagi SQL bilan yaratilgan
// bo'lishi kerak (bir marta SQL Editor'da ishga tushiriladi):
//
// create table if not exists order_items (
//   id bigint generated always as identity primary key,
//   order_id bigint references orders(id) on delete cascade,
//   product_id bigint references products(id) on delete set null,
//   product_name text,
//   quantity int not null,
//   price numeric not null,
//   created_at timestamptz default now()
// );

export type SalesCounts = Record<number, number>;

// Barcha vaqtlar davomida har bir mahsulotdan nechta dona sotilganini
// hisoblab beradi (product_id -> jami son).
export async function fetchProductSalesCounts(): Promise<SalesCounts> {
  const { data, error } = await supabase.from("order_items").select("product_id, quantity");
  if (error || !data) return {};
  const counts: SalesCounts = {};
  for (const row of data as any[]) {
    if (row.product_id == null) continue;
    counts[row.product_id] = (counts[row.product_id] || 0) + (row.quantity || 0);
  }
  return counts;
}

// Kategoriyadagi mahsulotlar sonига qarab, shu kategoriyadan nechta "eng
// ko'p sotiladigan" mahsulot ko'rsatish kerakligini aniqlaydi (3/6/9/12).
export function tierCountFor(categorySize: number): number {
  if (categorySize <= 5) return 3;
  if (categorySize <= 10) return 6;
  if (categorySize <= 20) return 9;
  return 12;
}

// Homepage uchun: har bir kategoriyadan eng ko'p sotiladigan mahsulotlarni
// (tier-count asosida) tanlab, bitta ro'yxatga birlashtiradi. Agar hech qanday
// sotuv ma'lumoti bo'lmasa (yangi do'kon), oddiygina eng yangi mahsulotlarni
// ko'rsatadi - bo'sh bo'lib qolmasligi uchun.
export function buildBestSellingList(
  products: Product[],
  categories: Category[],
  salesCounts: SalesCounts
): Product[] {
  const result: Product[] = [];
  const hasAnySales = Object.keys(salesCounts).length > 0;

  for (const cat of categories) {
    const catProducts = products.filter((p) => p.category === cat.name && p.hidden !== true);
    if (catProducts.length === 0) continue;
    const n = tierCountFor(catProducts.length);
    const sorted = [...catProducts].sort((a, b) => {
      const diff = (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0);
      if (diff !== 0) return diff;
      return hasAnySales ? b.id - a.id : b.id - a.id;
    });
    result.push(...sorted.slice(0, n));
  }
  return result;
}

// Qidiruv sahifasi uchun: kategoriyalarga ajratmasdan, umuman eng ko'p
// sotib olingan top-N mahsulot.
export function buildGlobalBestSellers(products: Product[], salesCounts: SalesCounts, limit = 12): Product[] {
  return [...products]
    .filter((p) => p.hidden !== true)
    .sort((a, b) => (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0))
    .slice(0, limit);
}

export type UserPurchaseHistory = {
  recentProductIds: number[];
  mostPurchasedIds: number[];
};

// Muayyan foydalanuvchining o'z xarid tarixi - "oxirgi sotib olingan" va
// "eng ko'p sotib olingan" (shu foydalanuvchi uchun) bo'limlari uchun.
export async function fetchUserPurchaseHistory(userId: string): Promise<UserPurchaseHistory> {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (ordersError || !orders || orders.length === 0) {
    return { recentProductIds: [], mostPurchasedIds: [] };
  }

  const orderIds = orders.map((o: any) => o.id);
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id, product_id, quantity, created_at")
    .in("order_id", orderIds);

  if (itemsError || !items) {
    return { recentProductIds: [], mostPurchasedIds: [] };
  }

  // Eng oxirgi buyurtmalardan boshlab, takrorlanmagan mahsulot id'lari.
  const orderIdToIndex = new Map(orderIds.map((id: number, i: number) => [id, i]));
  const sortedItems = [...items].sort(
    (a: any, b: any) => (orderIdToIndex.get(a.order_id) ?? 0) - (orderIdToIndex.get(b.order_id) ?? 0)
  );
  const recentSeen = new Set<number>();
  const recentProductIds: number[] = [];
  for (const row of sortedItems as any[]) {
    if (row.product_id == null || recentSeen.has(row.product_id)) continue;
    recentSeen.add(row.product_id);
    recentProductIds.push(row.product_id);
  }

  const counts: SalesCounts = {};
  for (const row of items as any[]) {
    if (row.product_id == null) continue;
    counts[row.product_id] = (counts[row.product_id] || 0) + (row.quantity || 0);
  }
  const mostPurchasedIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id));

  return { recentProductIds: recentProductIds.slice(0, 12), mostPurchasedIds: mostPurchasedIds.slice(0, 12) };
}
