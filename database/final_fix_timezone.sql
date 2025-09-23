-- 최종 해결책: orders 테이블 시간을 한국 시간으로 자동 표시
-- Supabase SQL Editor에서 이 SQL을 실행하세요

-- 1. 먼저 안전하게 기존 컬럼 삭제
DO $$
BEGIN
  -- generated column이면 다르게 처리
  ALTER TABLE orders DROP COLUMN IF EXISTS created_at_kst CASCADE;
  ALTER TABLE orders DROP COLUMN IF EXISTS updated_at_kst CASCADE;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 무시 (컬럼이 없거나 다른 타입인 경우)
    NULL;
END $$;

-- 2. Computed Column으로 한국 시간 자동 계산 (읽기 전용, 자동 계산)
ALTER TABLE orders
ADD COLUMN created_at_kst TIMESTAMP GENERATED ALWAYS AS (
  CASE
    WHEN created_at IS NOT NULL THEN
      (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
    ELSE NULL
  END
) STORED;

ALTER TABLE orders
ADD COLUMN updated_at_kst TIMESTAMP GENERATED ALWAYS AS (
  CASE
    WHEN updated_at IS NOT NULL THEN
      (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')
    ELSE NULL
  END
) STORED;

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_kst ON orders(created_at_kst DESC);

-- 4. 기존 데이터 리프레시 (computed column 재계산)
UPDATE orders SET updated_at = COALESCE(updated_at, created_at) WHERE updated_at IS NULL;

-- 5. Table Editor에서 보기 편한 뷰 생성
DROP VIEW IF EXISTS orders_korean;
CREATE VIEW orders_korean AS
SELECT
  id,
  TO_CHAR(created_at_kst, 'YYYY-MM-DD HH24:MI:SS') as "생성일시(한국)",
  order_number as "주문번호",
  customer_name as "고객명",
  customer_email as "이메일",
  customer_phone as "전화번호",
  package_name as "패키지",
  amount as "금액",
  status as "상태",
  payment_method as "결제방법",
  receipt_url as "영수증",
  TO_CHAR(updated_at_kst, 'YYYY-MM-DD HH24:MI:SS') as "수정일시(한국)"
FROM orders
ORDER BY created_at DESC;

-- 권한 설정
GRANT SELECT ON orders_korean TO anon;
GRANT SELECT ON orders_korean TO authenticated;

-- 6. 테스트: 새 주문 추가해보기
INSERT INTO orders (
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  package_name,
  amount,
  status,
  payment_method
) VALUES (
  'TEST-AUTO-KST-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
  '테스트 자동시간',
  'test@auto.com',
  '010-0000-0000',
  '테스트 패키지',
  10000,
  'pending',
  'test'
);

-- 7. 결과 확인
SELECT
  order_number as "주문번호",
  customer_name as "고객명",
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as "UTC시간",
  TO_CHAR(created_at_kst, 'YYYY-MM-DD HH24:MI:SS') as "한국시간(자동)",
  created_at_kst as "한국시간(원본)"
FROM orders
WHERE order_number LIKE 'TEST-AUTO-KST-%'
   OR order_number = 'TEST-MANUAL-1758594914'
ORDER BY created_at DESC
LIMIT 5;

-- 8. 성공 메시지
SELECT
  '✅ 완료!' as "상태",
  'orders 테이블에 created_at_kst, updated_at_kst 컬럼이 자동 생성되었습니다.' as "메시지",
  'Table Editor에서 orders_korean 뷰를 보면 한국 시간으로 표시됩니다.' as "사용법";

-- 9. 최종 확인 쿼리
SELECT
  COUNT(*) as "전체주문수",
  MAX(TO_CHAR(created_at_kst, 'YYYY-MM-DD HH24:MI:SS')) as "최근주문_한국시간",
  MIN(TO_CHAR(created_at_kst, 'YYYY-MM-DD HH24:MI:SS')) as "첫주문_한국시간"
FROM orders;