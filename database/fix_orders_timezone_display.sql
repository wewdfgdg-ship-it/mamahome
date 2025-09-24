-- orders 테이블의 시간을 한국시간으로 표시하도록 완전히 수정
-- Supabase 대시보드에서 한국시간으로 표시되도록 설정

-- 1. 기존 트리거 제거
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- 2. 한국시간으로 자동 저장되는 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_orders_korean_time()
RETURNS TRIGGER AS $$
BEGIN
  -- 새로운 레코드 삽입 시
  IF TG_OP = 'INSERT' THEN
    NEW.created_at = COALESCE(NEW.created_at, NOW() AT TIME ZONE 'Asia/Seoul');
    NEW.updated_at = NOW() AT TIME ZONE 'Asia/Seoul';
  -- 레코드 업데이트 시
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW() AT TIME ZONE 'Asia/Seoul';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 새로운 트리거 생성 (INSERT와 UPDATE 모두 처리)
CREATE TRIGGER set_orders_korean_time
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_korean_time();

-- 4. 기존 데이터의 시간을 한국시간으로 조정
-- UTC로 저장된 기존 데이터를 한국시간으로 변환
UPDATE public.orders
SET
  created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul',
  updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul'
WHERE created_at IS NOT NULL;

-- 5. 한국시간 표시를 위한 뷰 생성 (선택사항)
-- 대시보드에서 직접 이 뷰를 사용하면 항상 한국시간으로 표시됨
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
  created_at AT TIME ZONE 'Asia/Seoul' as created_at,
  updated_at AT TIME ZONE 'Asia/Seoul' as updated_at,
  paid_at AT TIME ZONE 'Asia/Seoul' as paid_at,
  completed_at AT TIME ZONE 'Asia/Seoul' as completed_at,
  cancelled_at AT TIME ZONE 'Asia/Seoul' as cancelled_at
FROM public.orders;

-- 6. 결과 확인
SELECT
    order_number,
    customer_name,
    created_at,
    to_char(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "생성시간(KST)",
    updated_at,
    to_char(updated_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "수정시간(KST)"
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- 7. 세션 타임존을 한국으로 설정
SET timezone = 'Asia/Seoul';

-- 메시지 출력
SELECT 'Orders 테이블의 타임존이 한국시간으로 수정되었습니다.' AS message;