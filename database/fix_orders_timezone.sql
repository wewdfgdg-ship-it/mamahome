-- orders 테이블에 한국 시간 표시를 위한 SQL
-- Supabase Dashboard → SQL Editor에서 실행

-- 1. 먼저 기존 컬럼이 있는지 확인하고 없으면 추가
DO $$
BEGIN
    -- created_at_kst 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'created_at_kst'
    ) THEN
        ALTER TABLE orders
        ADD COLUMN created_at_kst TIMESTAMP GENERATED ALWAYS AS
          (created_at AT TIME ZONE 'Asia/Seoul') STORED;
    END IF;

    -- updated_at_kst 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'updated_at_kst'
    ) THEN
        ALTER TABLE orders
        ADD COLUMN updated_at_kst TIMESTAMP GENERATED ALWAYS AS
          (updated_at AT TIME ZONE 'Asia/Seoul') STORED;
    END IF;
END $$;

-- 2. 기존 데이터에 대해 업데이트 트리거
UPDATE orders SET updated_at = updated_at WHERE updated_at IS NOT NULL;

-- 3. 한국 시간으로 표시하는 뷰 생성 (기존 뷰 삭제 후 재생성)
DROP VIEW IF EXISTS orders_kst;

CREATE OR REPLACE VIEW orders_kst AS
SELECT
  id,
  order_number,
  user_id,
  customer_name,
  customer_email,
  customer_phone,
  business_name,
  business_number,
  package_name,
  package_price,
  amount,
  payment_method,
  payment_status,
  status,
  receipt_url,
  notes,
  -- 한국 시간으로 변환
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as created_at_display,
  TO_CHAR(updated_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as updated_at_display,
  -- 생성된 KST 컬럼 (있는 경우)
  created_at_kst,
  updated_at_kst,
  -- 원본 UTC 시간
  created_at,
  updated_at
FROM orders
ORDER BY created_at DESC;

-- 4. 뷰에 대한 권한 부여
GRANT SELECT ON orders_kst TO anon;
GRANT SELECT ON orders_kst TO authenticated;

-- 5. 테이블 에디터에서 한국 시간으로 표시하도록 함수 생성
CREATE OR REPLACE FUNCTION get_orders_with_kst()
RETURNS TABLE (
  id INT8,
  created_at TEXT,
  order_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  business_name TEXT,
  business_number TEXT,
  package_name TEXT,
  amount NUMERIC,
  payment_method TEXT,
  status TEXT,
  receipt_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    TO_CHAR(o.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as created_at,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.business_name,
    o.business_number,
    o.package_name,
    o.amount,
    o.payment_method,
    o.status,
    o.receipt_url
  FROM orders o
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. 확인 쿼리
SELECT
  order_number as "주문번호",
  customer_name as "고객명",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "주문시간(KST)",
  status as "상태"
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 완료 메시지
SELECT '✅ orders 테이블에 한국 시간 설정이 완료되었습니다.' as message;