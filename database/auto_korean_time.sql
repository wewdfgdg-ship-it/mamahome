-- Supabase에서 자동으로 한국 시간 표시하기
-- 이 SQL을 Supabase SQL Editor에서 한 번만 실행하면 영구적으로 적용됩니다.

-- 1. 기존 컬럼이 있으면 삭제
ALTER TABLE orders
DROP COLUMN IF EXISTS created_at_kst,
DROP COLUMN IF EXISTS updated_at_kst;

-- 2. 한국 시간 저장용 컬럼 추가 (실제 데이터를 저장)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS created_at_kst TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at_kst TIMESTAMPTZ;

-- 3. 트리거 함수 생성 - INSERT/UPDATE 시 자동으로 한국 시간 계산
CREATE OR REPLACE FUNCTION update_korean_time()
RETURNS TRIGGER AS $$
BEGIN
  -- created_at_kst 설정 (INSERT 시에만)
  IF TG_OP = 'INSERT' THEN
    NEW.created_at_kst = TIMEZONE('Asia/Seoul', COALESCE(NEW.created_at, NOW()));
    NEW.updated_at_kst = TIMEZONE('Asia/Seoul', COALESCE(NEW.updated_at, NOW()));
  END IF;

  -- updated_at_kst 업데이트 (UPDATE 시)
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at_kst = TIMEZONE('Asia/Seoul', NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성
DROP TRIGGER IF EXISTS orders_korean_time_trigger ON orders;
CREATE TRIGGER orders_korean_time_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_korean_time();

-- 5. 기존 데이터 업데이트
UPDATE orders
SET
  created_at_kst = TIMEZONE('Asia/Seoul', created_at),
  updated_at_kst = TIMEZONE('Asia/Seoul', COALESCE(updated_at, created_at))
WHERE created_at_kst IS NULL;

-- 6. Table Editor에서 보기 좋게 하기 위한 뷰 생성
DROP VIEW IF EXISTS orders_view;
CREATE OR REPLACE VIEW orders_view AS
SELECT
  id,
  -- 한국 시간을 문자열로 포맷
  TO_CHAR(TIMEZONE('Asia/Seoul', created_at), 'YYYY-MM-DD HH24:MI:SS') as "생성시간",
  order_number as "주문번호",
  customer_name as "고객명",
  customer_email as "이메일",
  customer_phone as "전화번호",
  business_name as "사업자명",
  business_number as "사업자번호",
  package_name as "패키지",
  amount as "금액",
  payment_method as "결제방법",
  status as "상태",
  receipt_url as "영수증URL",
  -- 원본 시간도 포함
  created_at,
  updated_at,
  created_at_kst,
  updated_at_kst
FROM orders
ORDER BY created_at DESC;

-- 권한 부여
GRANT SELECT ON orders_view TO anon;
GRANT SELECT ON orders_view TO authenticated;

-- 7. RLS 정책 확인 및 설정
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 기본 정책 생성 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" ON orders
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Enable insert for all users'
  ) THEN
    CREATE POLICY "Enable insert for all users" ON orders
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'orders' AND policyname = 'Enable update for all users'
  ) THEN
    CREATE POLICY "Enable update for all users" ON orders
      FOR UPDATE USING (true);
  END IF;
END $$;

-- 8. 확인 쿼리
SELECT
  order_number as "주문번호",
  customer_name as "고객명",
  TO_CHAR(TIMEZONE('Asia/Seoul', created_at), 'YYYY-MM-DD HH24:MI:SS') as "한국시간",
  status as "상태"
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 완료 메시지
SELECT '✅ 자동 한국 시간 설정 완료! 이제 모든 새 주문은 자동으로 한국 시간이 저장됩니다.' as message;