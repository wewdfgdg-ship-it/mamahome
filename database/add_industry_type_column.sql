-- Supabase SQL Editor에서 실행할 SQL
-- orders 테이블에 industry_type (업종) 컬럼 추가

-- 1. orders 테이블에 industry_type 컬럼 추가
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS industry_type text;

-- 2. orders_kst 뷰 재생성 (industry_type 포함)
CREATE OR REPLACE VIEW public.orders_kst AS
SELECT
    id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    business_name,
    business_number,
    industry_type,  -- 새로 추가된 업종 컬럼
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

-- 3. 컬럼 설명 추가 (선택사항)
COMMENT ON COLUMN public.orders.industry_type IS '업종 선택 (음식점, 카페, 미용실, 네일샵, 마사지샵, 기타 등)';

-- 4. 기존 데이터에 대한 기본값 설정 (선택사항)
-- UPDATE public.orders
-- SET industry_type = '미입력'
-- WHERE industry_type IS NULL;