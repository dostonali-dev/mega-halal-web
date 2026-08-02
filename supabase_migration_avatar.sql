-- Mega Halal Supermarket - mijozning o'z profil rasmini qo'yishi uchun.
-- Supabase Dashboard > SQL Editor > New query bo'limiga joylashtirib,
-- "Run" tugmasini bosing (bir marta ishga tushirilsa yetarli).

alter table profiles add column if not exists avatar_url text;
