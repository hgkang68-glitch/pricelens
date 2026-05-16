-- ============================================================
-- PriceLens Supabase 스키마
-- Supabase 대시보드 → SQL Editor 에서 실행하세요
-- ============================================================

-- 1. 코스트코 상품 테이블
create table if not exists products (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  emoji       text default '📦',
  category    text not null,
  costco_price integer not null,
  unit        text,
  search_query text not null,
  notes       text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. 가격 비교 스냅샷 (사용자가 저장 버튼 누를 때)
create table if not exists price_snapshots (
  id              uuid default gen_random_uuid() primary key,
  product_id      uuid references products(id) on delete set null,
  product_name    text not null,
  category        text,
  costco_price    integer,
  naver_price     integer,
  naver_ship      integer default 0,
  naver_total     integer,
  coupang_price   integer,
  coupang_ship    integer default 0,
  coupang_total   integer,
  eleventh_price  integer,
  eleventh_ship   integer default 0,
  eleventh_total  integer,
  gmarket_price   integer,
  gmarket_ship    integer default 0,
  gmarket_total   integer,
  winner_platform text,
  winner_price    integer,
  saving_amount   integer,
  collected_at    timestamptz default now()
);

-- 3. 가격 이력 (Cron이 매일 자동 수집)
create table if not exists price_history (
  id           uuid default gen_random_uuid() primary key,
  product_id   uuid references products(id) on delete cascade,
  platform     text not null,
  price        integer,
  shipping_fee integer default 0,
  total_price  integer,
  collected_at timestamptz default now()
);

-- 인덱스
create index if not exists idx_snapshots_collected at on price_snapshots(collected_at desc);
create index if not exists idx_history_product on price_history(product_id, platform, collected_at desc);

-- RLS 활성화 (공개 읽기, 서비스키로 쓰기)
alter table products       enable row level security;
alter table price_snapshots enable row level security;
alter table price_history   enable row level security;

drop policy if exists "public_read_products"   on products;
drop policy if exists "public_read_snapshots"  on price_snapshots;
drop policy if exists "public_read_history"    on price_history;
drop policy if exists "service_all_products"   on products;
drop policy if exists "service_all_snapshots"  on price_snapshots;
drop policy if exists "service_all_history"    on price_history;

create policy "public_read_products"  on products        for select using (true);
create policy "public_read_snapshots" on price_snapshots for select using (true);
create policy "public_read_history"   on price_history   for select using (true);
create policy "service_all_products"  on products        for all    using (true);
create policy "service_all_snapshots" on price_snapshots for all    using (true);
create policy "service_all_history"   on price_history   for all    using (true);

-- 샘플 상품 데이터
insert into products (name, emoji, category, costco_price, unit, search_query) values
('Kirkland 혼합 견과류',   '🥜', '식품',       22990, '1.13kg', 'Kirkland 혼합견과류 1.13kg'),
('Kirkland 올리브오일',    '🫒', '식품',       34990, '3L',     'Kirkland 엑스트라버진 올리브오일 3L'),
('Kirkland 다크초콜릿',    '🍫', '식품',       19900, '1.36kg', 'Kirkland 다크초콜릿 1.36kg'),
('Kirkland 화장지 30롤',   '🧻', '생활용품',   18900, '30롤',   'Kirkland 화장지 30롤'),
('Kirkland 피쉬오일',      '🐟', '건강기능식품', 28500, '400캡슐','Kirkland 오메가3 피쉬오일 400캡슐'),
('Kirkland 비타민C',       '🍊', '건강기능식품', 19900, '500정', 'Kirkland 비타민C 1000mg 500정')
on conflict do nothing;
