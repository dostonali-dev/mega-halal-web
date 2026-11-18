-- "Ishlab chiqaruvchi" (mijozga ko'rinadigan brend/ishlab chiqaruvchi nomi)
-- maydoni. "Firma / yetkazib beruvchi" dan farqli - bu MAHSULOT KARTASIDA
-- mijozlarga ham ko'rinadi (ismlari bo'sh bo'lsa, shu qator shunchaki
-- ko'rsatilmaydi).
-- Buni Supabase Dashboard -> SQL Editor -> New query bo'limiga ochib, ishga tushiring.

ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer text;
