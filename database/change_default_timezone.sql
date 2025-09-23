-- Supabase 프로젝트 기본 시간대를 한국으로 변경
-- 주의: 이 설정은 현재 세션에만 적용됩니다. 영구 적용하려면 Supabase 대시보드에서 설정해야 합니다.

-- 1. 현재 시간대 확인
SELECT current_setting('TIMEZONE');

-- 2. 세션 시간대를 한국으로 변경
SET TIME ZONE 'Asia/Seoul';

-- 3. 변경 확인
SELECT NOW() as "현재시간_한국";

-- 4. orders 테이블에 컬럼 타입 변경 (TIMESTAMP -> TIMESTAMPTZ)
-- 이렇게 하면 시간대 정보가 포함되어 자동 변환됩니다
ALTER TABLE orders
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- 5. 기본값 설정 - 한국 시간으로 자동 저장
ALTER TABLE orders
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul'),
  ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul');

-- 6. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (NOW() AT TIME ZONE 'Asia/Seoul');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 업데이트 트리거 생성
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. 기존 데이터를 한국 시간으로 조정 (UTC+9)
UPDATE orders
SET
  created_at = created_at + INTERVAL '9 hours',
  updated_at = COALESCE(updated_at, created_at) + INTERVAL '9 hours'
WHERE created_at < '2025-01-01'::timestamp;  -- 안전을 위해 특정 날짜 이전 데이터만

-- 9. 확인
SELECT
  order_number,
  customer_name,
  created_at as "생성시간",
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as "포맷된시간"
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 완료 메시지
SELECT '✅ 시간대 설정 완료! Table Editor를 새로고침하세요.' as message;