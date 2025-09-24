-- orders 테이블을 원래 상태(TIMESTAMP WITH TIME ZONE)로 복원
-- 관리자 페이지에서만 한국시간으로 변환해서 표시하도록 할 것

-- 1. 임시 컬럼 추가 (TIMESTAMP WITH TIME ZONE)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS created_at_tz TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at_tz TIMESTAMP WITH TIME ZONE;

-- 2. 기존 데이터를 UTC 기준으로 변환하여 복사
-- 한국시간으로 저장된 것을 UTC로 변환
UPDATE public.orders
SET
  created_at_tz = created_at::timestamp AT TIME ZONE 'Asia/Seoul',
  updated_at_tz = updated_at::timestamp AT TIME ZONE 'Asia/Seoul';

-- 3. 기존 컬럼 삭제
ALTER TABLE public.orders
DROP COLUMN created_at CASCADE,
DROP COLUMN updated_at CASCADE;

-- 4. 새 컬럼 이름을 원래 이름으로 변경
ALTER TABLE public.orders
RENAME COLUMN created_at_tz TO created_at;

ALTER TABLE public.orders
RENAME COLUMN updated_at_tz TO updated_at;

-- 5. 기본값 설정 (UTC 시간)
ALTER TABLE public.orders
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW();

-- 6. NOT NULL 제약조건 추가
ALTER TABLE public.orders
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- 7. 트리거 함수 재생성 (UTC 기준)
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 재생성
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- 9. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 10. 결과 확인
SELECT
    order_number,
    customer_name,
    created_at,
    updated_at,
    to_char(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "생성시간(KST)"
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- 메시지 출력
SELECT 'Orders 테이블이 원래 상태(TIMESTAMP WITH TIME ZONE)로 복원되었습니다.' AS message;