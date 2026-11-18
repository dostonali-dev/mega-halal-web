-- Mahsulot og'irligi/hajmi endi gr/kg/L birliklarida ko'rsatilishi uchun.
-- 1) "gram" ustunini numeric qilamiz (0.5 kg, 1.5 L kabi kasr sonlar
--    kiritilishi mumkin bo'lishi uchun) - integer qiymatlar ham muammosiz
--    o'tadi, hech narsa yo'qolmaydi.
-- 2) "weight_unit" degan yangi ustun qo'shamiz (gr/kg/L), standart "gr".
-- Buni Supabase Dashboard -> SQL Editor -> New query bo'limiga ochib, ishga tushiring.

ALTER TABLE products ALTER COLUMN gram TYPE numeric USING gram::numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'gr';
