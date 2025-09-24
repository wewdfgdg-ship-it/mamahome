-- orders 테이블의 시간을 한국시간으로 표시하도록 설정
-- users 테이블처럼 orders 테이블도 한국시간으로 표시

-- 1. orders 테이블의 created_at, updated_at 컬럼 타입 확인 및 변경
-- timezone 정보가 포함된 timestamptz 타입으로 변경 (이미 timestamptz인 경우 무시됨)
ALTER TABLE public.orders
ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- 2. 기본 timezone 설정을 한국 시간으로 변경
ALTER TABLE public.orders
ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'Asia/Seoul'),
ALTER COLUMN updated_at SET DEFAULT (now() AT TIME ZONE 'Asia/Seoul');

-- 3. 기존 데이터를 한국시간 기준으로 업데이트 (선택사항)
-- 주의: 이미 UTC로 저장된 데이터가 있다면 이 쿼리는 실행하지 마세요
-- UPDATE public.orders
-- SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul',
--     updated_at = updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul';

-- 4. Supabase 대시보드에서 한국시간으로 표시되도록 설정
-- 세션 레벨에서 timezone 설정
SET timezone = 'Asia/Seoul';

-- 5. 확인 쿼리 - 한국시간으로 표시되는지 확인
SELECT
    order_number,
    customer_name,
    created_at,
    updated_at,
    to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "생성시간(KST)",
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "수정시간(KST)"
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;