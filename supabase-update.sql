-- Supabase SQL Editor에서 실행하세요
-- 기존 products 테이블에 객단가 관련 컬럼 추가

alter table products add column if not exists unit_qty    numeric default null;
alter table products add column if not exists unit_base   text    default '100g';
alter table products add column if not exists unit_price  numeric generated always as (
  case when unit_qty > 0 then round((costco_price::numeric / unit_qty) * 100) else null end
) stored;

-- 기존 데이터 예시 업데이트
update products set unit_qty = 1130, unit_base = '100g'  where name like '%견과류%';
update products set unit_qty = 3000, unit_base = '100ml' where name like '%올리브오일%';
update products set unit_qty = 400,  unit_base = '1캡슐' where name like '%피쉬오일%';
update products set unit_qty = 500,  unit_base = '1정'   where name like '%비타민%';
update products set unit_qty = 30,   unit_base = '1롤'   where name like '%화장지%';
