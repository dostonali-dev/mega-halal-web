-- Mega Halal Supermarket - mijoz ilovasidagi "Bildirishnomalar" bo'limi
-- uchun. Har safar mijozga push yuborilganda (admin "Push xabar"dan,
-- buyurtma holati o'zgarganda yoki izohga javob yozilganda) shu jadvalga
-- bir qator yoziladi, mijoz esa Profil > Bildirishnomalar sahifasida
-- shu xabarlarni ko'radi (push o'zi kelmagan taqdirda ham).
--
-- Supabase Dashboard > SQL Editor > New query bo'limiga joylashtirib,
-- "Run" tugmasini bosing (bir marta ishga tushirilsa yetarli).

create table if not exists customer_notifications (
  id bigint generated always as identity primary key,
  title text not null,
  message text not null,
  url text,
  target_user_id uuid,
  created_at timestamptz default now()
);

create index if not exists customer_notifications_target_user_id_idx
  on customer_notifications(target_user_id);

create index if not exists customer_notifications_created_at_idx
  on customer_notifications(created_at desc);
