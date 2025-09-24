-- orders 테이블의 타임스탬프 컬럼을 한국시간으로 저장하도록 수정
-- 이 방법은 users 테이블과 동일한 방식으로 처리

-- 1. 임시 컬럼 추가 (한국시간 저장용)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS created_at_kst TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at_kst TIMESTAMP WITHOUT TIME ZONE;

-- 2. 기존 데이터를 한국시간으로 변환하여 새 컬럼에 복사
UPDATE public.orders
SET
  created_at_kst = (created_at AT TIME ZONE 'Asia/Seoul')::timestamp,
  updated_at_kst = (updated_at AT TIME ZONE 'Asia/Seoul')::timestamp;

-- 3. 기존 컬럼 삭제
ALTER TABLE public.orders
DROP COLUMN created_at CASCADE,
DROP COLUMN updated_at CASCADE;

-- 4. 새 컬럼 이름을 원래 이름으로 변경
ALTER TABLE public.orders
RENAME COLUMN created_at_kst TO created_at;

ALTER TABLE public.orders
RENAME COLUMN updated_at_kst TO updated_at;

-- 5. 기본값 설정 (한국시간)
ALTER TABLE public.orders
ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul')::timestamp,
ALTER COLUMN updated_at SET DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul')::timestamp;

-- 6. NOT NULL 제약조건 추가
ALTER TABLE public.orders
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- 7. 트리거 함수 재생성 (한국시간 기준)
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (NOW() AT TIME ZONE 'Asia/Seoul')::timestamp;
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
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "생성시간(KST)",
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "수정시간(KST)"
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- 메시지 출력
SELECT 'Orders 테이블이 한국시간(TIMESTAMP WITHOUT TIME ZONE)으로 변경되었습니다.' AS message;