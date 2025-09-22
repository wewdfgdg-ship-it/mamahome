-- Supabase에서 한국 시간 표시를 위한 SQL
-- 실행 방법: Supabase Dashboard → SQL Editor → 이 내용 복사 후 실행

-- ==========================================
-- 방법 1: orders 테이블에 계산된 컬럼 추가 (가상 컬럼)
-- ==========================================

-- 한국 시간 표시용 가상 컬럼 추가
ALTER TABLE orders
ADD COLUMN created_at_kst TIMESTAMP GENERATED ALWAYS AS
  (created_at AT TIME ZONE 'Asia/Seoul') STORED;

ALTER TABLE orders
ADD COLUMN updated_at_kst TIMESTAMP GENERATED ALWAYS AS
  (updated_at AT TIME ZONE 'Asia/Seoul') STORED;

-- 기존 데이터에 대해 한국 시간 업데이트
UPDATE orders SET updated_at = updated_at;

-- ==========================================
-- 방법 2: 한국 시간으로 표시하는 뷰(View) 생성
-- ==========================================

-- 기존 뷰가 있으면 삭제
DROP VIEW IF EXISTS orders_kst;

-- 한국 시간으로 변환된 뷰 생성
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
  notes,
  -- UTC 시간을 한국 시간으로 변환
  (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as created_at_kst,
  (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as updated_at_kst,
  (paid_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as paid_at_kst,
  (completed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as completed_at_kst,
  (cancelled_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul') as cancelled_at_kst,
  -- 원본 UTC 시간도 포함
  created_at,
  updated_at,
  paid_at,
  completed_at,
  cancelled_at
FROM orders
ORDER BY created_at DESC;

-- 뷰에 대한 권한 부여
GRANT SELECT ON orders_kst TO anon;
GRANT SELECT ON orders_kst TO authenticated;

-- ==========================================
-- 방법 3: 함수를 사용한 포맷팅
-- ==========================================

-- 한국 시간 포맷 함수 생성
CREATE OR REPLACE FUNCTION format_kst_time(utc_time TIMESTAMP WITH TIME ZONE)
RETURNS TEXT AS $$
BEGIN
  IF utc_time IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN TO_CHAR(
    utc_time AT TIME ZONE 'Asia/Seoul',
    'YYYY-MM-DD HH24:MI:SS'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 사용 예시:
-- SELECT format_kst_time(created_at) as 생성시간_한국 FROM orders;

-- ==========================================
-- 방법 4: 테이블 기본 표시 시간대 변경 (선택사항)
-- ==========================================

-- 세션별 시간대 설정 (현재 세션에만 적용)
SET timezone = 'Asia/Seoul';

-- 데이터베이스 전체 기본 시간대 변경 (관리자 권한 필요)
-- ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- ==========================================
-- 확인 쿼리
-- ==========================================

-- 한국 시간으로 변환된 데이터 확인
SELECT
  order_number as "주문번호",
  customer_name as "고객명",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "주문시간(한국)",
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as "주문시간(UTC)",
  status as "상태"
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 뷰 사용하여 조회
SELECT * FROM orders_kst LIMIT 10;

-- ==========================================
-- 참고: Supabase Dashboard에서 보기
-- ==========================================
-- 1. SQL Editor에서 위 쿼리 실행
-- 2. Table Editor에서 'orders_kst' 뷰를 선택하면 한국 시간으로 표시됨
-- 3. 또는 SQL Editor에서 직접 SELECT 쿼리 실행하여 확인

COMMENT ON VIEW orders_kst IS '주문 테이블 - 한국 시간(KST) 표시용 뷰';