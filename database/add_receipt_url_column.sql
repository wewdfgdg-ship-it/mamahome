-- orders 테이블에 receipt_url 컬럼 추가
-- PayApp 영수증 URL 저장용

-- 1. receipt_url 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN public.orders.receipt_url IS 'PayApp 영수증 URL (https://www.payapp.kr/CST/xxxxx 형식)';

-- 3. 기존 데이터 확인 (선택사항)
-- 최근 5개 주문의 receipt_url 확인
SELECT
    order_number,
    customer_name,
    amount,
    receipt_url,
    created_at
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- 4. 인덱스 추가 (선택사항)
-- receipt_url로 빠른 검색이 필요한 경우
-- CREATE INDEX IF NOT EXISTS idx_orders_receipt_url ON public.orders(receipt_url);

-- 5. 테이블 구조 확인
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'receipt_url';