-- Mega Halal Supermarket - mahsulot "variantlari" (masalan bitta ichimlikning
-- turli lazzatlari: Lime, Qulupnay va h.k.) uchun. Har bir variant - alohida
-- "products" qatori (o'z narxi, ombori, rasmi bilan), lekin "parent_product_id"
-- orqali bosh mahsulotga bog'lanadi. Shu sabab savatcha/buyurtma tizimida
-- HECH QANDAY o'zgarish kerak emas - har bir variant oddiy mahsulot sifatida
-- ishlaydi, faqat ro'yxatlarda (bosh sahifa, kategoriya, qidiruv) yashiriladi
-- va bosh mahsulot sahifasida "lazzat tanlash" tugmalari sifatida chiqadi.
--
-- Supabase Dashboard > SQL Editor > New query bo'limiga joylashtirib,
-- "Run" tugmasini bosing (bir marta ishga tushirilsa yetarli).

alter table products add column if not exists parent_product_id bigint references products(id) on delete set null;
alter table products add column if not exists variant_name text;

create index if not exists products_parent_product_id_idx on products(parent_product_id);
