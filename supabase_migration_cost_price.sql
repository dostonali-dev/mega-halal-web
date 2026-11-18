-- "Kelgan narxi" (tannarx) - mahsulot sizga qancha turganini yozib
-- qo'yish uchun. Bu FAQAT ADMIN panelida ko'rinadi, mijozga hech qachon
-- ko'rsatilmaydi (keyinchalik foyda/marja hisob-kitobi uchun kerak bo'ladi).
-- Buni Supabase Dashboard -> SQL Editor -> New query bo'limiga ochib, ishga tushiring.

ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric;
