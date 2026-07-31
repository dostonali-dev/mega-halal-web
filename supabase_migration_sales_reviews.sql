-- Mega Halal Supermarket - yangi funksiyalar uchun bazaga qo'shimchalar
-- Supabase Dashboard > SQL Editor > New query bo'limiga joylashtirib,
-- "Run" tugmasini bosing (bir marta ishga tushirilsa yetarli).

-- 1) Har bir buyurtmadagi mahsulotlarni alohida saqlash uchun.
-- "Eng ko'p sotiladigan" / "eng ko'p sotib olingan" / "oxirgi sotib olingan"
-- bo'limlari shu jadval asosida ishlaydi.
create table if not exists order_items (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  product_id bigint references products(id) on delete set null,
  product_name text,
  quantity int not null,
  price numeric not null,
  created_at timestamptz default now()
);
create index if not exists order_items_product_id_idx on order_items(product_id);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- 2) Yetkazib berilgan buyurtmalarni baholash (yulduzcha + izoh) uchun.
create table if not exists order_reviews (
  id bigint generated always as identity primary key,
  order_id bigint references orders(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
create unique index if not exists order_reviews_order_id_idx on order_reviews(order_id);

-- 3) Xavfsizlik siyosati (RLS) - agar orders/products jadvallaringizda RLS
-- yoqilgan bo'lsa, shu ikki yangi jadval uchun ham o'qish/yozishga ruxsat
-- berish kerak bo'lishi mumkin. Loyihangizda RLS o'chirilgan bo'lsa
-- (ko'pchilik joylarda supabaseAdmin/service-role ishlatilganidek), bu
-- qism shart emas - lekin xavfsizlik uchun tavsiya etiladi:
--
-- alter table order_items enable row level security;
-- alter table order_reviews enable row level security;
-- create policy "Public can insert order_items" on order_items for insert with check (true);
-- create policy "Public can select order_items" on order_items for select using (true);
-- create policy "Public can insert order_reviews" on order_reviews for insert with check (true);
-- create policy "Public can select order_reviews" on order_reviews for select using (true);
