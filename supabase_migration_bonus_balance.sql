-- Mijozlar uchun bonus balans tizimi
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bonus_balance numeric DEFAULT 0;

-- Buyurtmada qancha bonus ishlatilgani (hisobot/tekshirish uchun) - order.total
-- allaqachon bonus ayirilgan "to'lanishi kerak bo'lgan" summani ko'rsatadi,
-- shu ustun esa shu summadan qancha bonus bilan yopilganini ko'rsatadi.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bonus_used numeric DEFAULT 0;
