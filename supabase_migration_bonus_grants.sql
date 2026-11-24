-- Mega Halal Supermarket - bonus berish tarixi
-- Supabase Dashboard > SQL Editor > New query bo'limiga joylashtirib,
-- "Run" tugmasini bosing (bir marta ishga tushirilsa yetarli).

-- Admin tomonidan mijozga qo'lda berilgan har bir bonusni (miqdori, izohi,
-- sanasi) saqlab borish uchun. Admin > Mijozlar sahifasidagi "Berilgan
-- bonuslar tarixi" ro'yxati shu jadval asosida ishlaydi.
create table if not exists bonus_grants (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  amount numeric not null,
  comment text,
  created_at timestamptz default now()
);
create index if not exists bonus_grants_user_id_idx on bonus_grants(user_id);
create index if not exists bonus_grants_created_at_idx on bonus_grants(created_at desc);

-- Xavfsizlik siyosati (RLS) - loyihangizda RLS yoqilgan bo'lsa kerak
-- bo'lishi mumkin (order_items/order_reviews jadvallaridagi kabi). RLS
-- o'chirilgan bo'lsa (admin panelda supabaseAdmin/service-role ishlatilsa),
-- bu qism shart emas:
--
-- alter table bonus_grants enable row level security;
-- create policy "Public can insert bonus_grants" on bonus_grants for insert with check (true);
-- create policy "Public can select bonus_grants" on bonus_grants for select using (true);
