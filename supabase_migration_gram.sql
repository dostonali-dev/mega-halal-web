-- Mahsulotga og'irligi (gramm) maydonini qo'shish.
-- Buni Supabase Dashboard -> SQL Editor -> New query bo'limiga ochib, ishga tushiring.

ALTER TABLE products ADD COLUMN IF NOT EXISTS gram integer;
