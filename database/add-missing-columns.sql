-- users 테이블에 누락된 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. email_verified 컬럼 추가 (이메일 인증 여부)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- 2. is_active 컬럼 추가 (계정 활성화 여부)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. created_at 컬럼 추가 (생성 시간)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. updated_at 컬럼 추가 (수정 시간)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. last_login 컬럼 추가 (마지막 로그인)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 누락된 컬럼이 추가되었습니다!';
  RAISE NOTICE '📊 추가된 컬럼: email_verified, is_active, created_at, updated_at, last_login';
  RAISE NOTICE '🎉 이제 회원가입이 작동합니다!';
END $$;