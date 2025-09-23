-- Supabase SQL Editor에서 실행할 SQL (수정된 버전)
-- 순서: 1. 테이블에 컬럼 추가 → 2. View 삭제 → 3. View 재생성

-- 1. orders 테이블에 industry_type 컬럼 추가 (테이블에만 추가 가능)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS industry_type text;

-- 2. 기존 orders_kst VIEW 삭제
DROP VIEW IF EXISTS public.orders_kst;

-- 3. orders_kst VIEW 재생성 (industry_type 포함)
CREATE VIEW public.orders_kst AS
SELECT
    id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    business_name,
    industry_type,  -- 새로 추가된 업종 컬럼
    business_number,
    package_name,
    package_price,
    amount,
    payment_method,
    status,
    receipt_url,
    notes,
    updated_at,
    created_at,
    -- 한국 시간으로 변환
    (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as created_at_kst,
    (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as updated_at_kst
FROM public.orders;

-- 4. 컬럼 설명 추가
COMMENT ON COLUMN public.orders.industry_type IS '업종 선택 (음식점, 카페, 미용실, 네일샵, 마사지샵, 기타 등)';

-- 5. 확인용 쿼리 (실행 후 확인)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;