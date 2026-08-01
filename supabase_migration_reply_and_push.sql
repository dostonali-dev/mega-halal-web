-- Mega Halal Supermarket - "javob yozish" (admin -> mijoz) funksiyasi uchun
-- Supabase Dashboard > SQL Editor > New query bo'limiga joylashtirib,
-- "Run" tugmasini bosing (bir marta ishga tushirilsa yetarli).

alter table order_reviews add column if not exists reply text;
alter table order_reviews add column if not exists replied_at timestamptz;
