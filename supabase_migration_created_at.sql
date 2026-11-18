-- Mahsulotlar ro'yxatida "Yangi qo'shilganlar (7 kun)" va "Yangi qo'shilgan
-- sana bo'yicha saralash" filtrlari ishlashi uchun created_at ustuni kerak.
-- Supabase ko'pincha buni avtomatik qo'shadi - shuning uchun bu buyruq
-- xavfsiz: agar ustun allaqachon bor bo'lsa, hech narsa o'zgarmaydi.
-- Buni Supabase Dashboard -> SQL Editor -> New query bo'limiga ochib, ishga tushiring.

ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
