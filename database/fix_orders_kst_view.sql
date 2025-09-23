-- orders 테이블 한국시간 표시를 위한 orders_kst 뷰 재생성

-- 1. 기존 orders_kst 뷰 삭제
DROP VIEW IF EXISTS public.orders_kst CASCADE;

-- 2. orders_kst 뷰 재생성 (한국 시간 표시)
CREATE VIEW public.orders_kst AS
SELECT
    id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    business_name,
    industry_type,
    business_number,
    package_name,
    package_price,
    amount,
    payment_method,
    status,
    receipt_url,
    notes,
    -- 한국 시간으로 변환
    timezone('Asia/Seoul', created_at) as created_at_kst,
    timezone('Asia/Seoul', updated_at) as updated_at_kst,
    -- 원본 UTC 시간도 유지
    created_at,
    updated_at
FROM public.orders;

-- 3. 권한 설정
GRANT SELECT ON public.orders_kst TO anon;
GRANT SELECT ON public.orders_kst TO authenticated;

-- 4. 뷰 설명 추가
COMMENT ON VIEW public.orders_kst IS '주문 테이블 - 한국 시간(KST) 표시용 뷰';

-- 5. 테스트 쿼리
SELECT * FROM public.orders_kst ORDER BY created_at_kst DESC LIMIT 5;