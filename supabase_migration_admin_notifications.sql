-- Admin ilovasiga yuborilgan push bildirishnomalar tarixi (masalan "Yangi
-- buyurtma keldi"). Har safar lib/onesignal.ts'dagi sendAdminPush
-- chaqirilganda (push muvaffaqiyatli bo'lsin yoki bo'lmasin) shu jadvalga
-- yozib qo'yiladi - shunda admin ilovasidagi 🔔 (qo'ng'iroqcha) bo'limida
-- bu tarixni ko'rish mumkin, push o'zi qurilmaga yetib bormagan bo'lsa ham.
-- push_ok/push_error - keyingi safar push kelmay qolsa, sababini (masalan
-- "0 ta qurilmaga yetib bordi") shu yerdan ko'rish uchun.
-- Buni Supabase Dashboard -> SQL Editor -> New query bo'limiga ochib, ishga tushiring.

CREATE TABLE IF NOT EXISTS admin_notifications (
  id bigint generated always as identity primary key,
  title text NOT NULL,
  message text NOT NULL,
  url text,
  push_ok boolean,
  push_error text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
