-- orders 테이블 한국시간 표시 수정
-- users 테이블처럼 한국시간으로 표시되도록 설정

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
    -- 한국 시간으로 변환 (users 테이블과 동일한 방식)
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

-- 5. 확인 쿼리 - 최근 주문 10개 한국시간으로 표시
SELECT
    order_number as "주문번호",
    customer_name as "고객명",
    package_name as "패키지명",
    to_char(timezone('Asia/Seoul', created_at), 'YYYY. MM. DD. HH24:MI') as "주문시간(KST)",
    status as "상태"
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- 6. orders_kst 뷰로 조회
SELECT
    order_number,
    customer_name,
    to_char(created_at_kst, 'YYYY. MM. DD. HH24:MI') as "주문시간"
FROM public.orders_kst
ORDER BY created_at_kst DESC
LIMIT 10;