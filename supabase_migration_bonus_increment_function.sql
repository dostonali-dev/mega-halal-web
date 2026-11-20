-- Bonus balansini xavfsiz (atomik) o'zgartirish uchun funksiya.
--
-- MUAMMO: avvalgi kod "avval o'qib, keyin yozish" usulida ishlar edi
-- (masalan: joriy balansni o'qib, ustiga qo'shib, qaytadan yozardi). Agar
-- shu ORALIQDA o'qish biror sabab bilan muvaffaqiyatsiz bo'lsa yoki noto'g'ri
-- (masalan bo'sh/0) natija qaytarsa, keyingi yozish mijozning HAQIQIY
-- balansini noto'g'ri, kichik qiymat bilan BUTUNLAY ustidan yozib yuborardi
-- (masalan 30,000 bonusi bor mijozga 4,000 bonus berilganda, balansi
-- 34,000 bo'lish o'rniga 4,000 bo'lib qolgan holat shundan kelib chiqqan).
--
-- YECHIM: shu funksiya qo'shish/ayirishni bitta SQL amalida (atomik)
-- bajaradi - oraliqda noto'g'ri qiymat o'qib qolish xavfi umuman yo'q.
CREATE OR REPLACE FUNCTION increment_bonus_balance(p_user_id uuid, p_delta numeric)
RETURNS numeric
LANGUAGE sql
AS $$
  UPDATE profiles
  SET bonus_balance = GREATEST(COALESCE(bonus_balance, 0) + p_delta, 0)
  WHERE id = p_user_id
  RETURNING bonus_balance;
$$;
