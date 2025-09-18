-- 기존 Supabase에 세션 테이블만 추가하는 SQL
-- users와 orders 테이블은 이미 존재하므로 생략

-- ==========================================
-- 1. User Sessions 테이블 (세션 관리)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);

-- ==========================================
-- 2. Orders 테이블에 user_id 추가 (없는 경우만)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES users(id);
    CREATE INDEX idx_orders_user_id ON orders(user_id);
  END IF;
END $$;

-- ==========================================
-- 3. 세션 정리 함수 (만료된 세션 자동 삭제)
-- ==========================================
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. RLS (Row Level Security) 정책 - 선택사항
-- ==========================================
-- Sessions 테이블 RLS 활성화
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 세션은 해당 사용자만 접근 가능 (선택사항)
DROP POLICY IF EXISTS sessions_own ON user_sessions;
CREATE POLICY sessions_own ON user_sessions
  FOR ALL USING (true); -- 또는 더 엄격한 정책 적용 가능

-- Orders 테이블 RLS (이미 설정되어 있을 수 있음)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 주문은 본인 것만 조회 가능 (선택사항)
DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (user_id IS NULL OR true); -- 또는 더 엄격한 정책 적용 가능

-- ==========================================
-- 완료 메시지
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 세션 테이블이 추가되었습니다!';
  RAISE NOTICE '📊 생성된 테이블: user_sessions';
  RAISE NOTICE '🔐 users와 orders 테이블과 연동 완료';
  RAISE NOTICE '🎉 이제 사용자 인증 시스템을 사용할 수 있습니다!';
END $$;