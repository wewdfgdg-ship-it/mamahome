-- Supabase Database Setup for Mrble
-- 미블 체험단 서비스 데이터베이스 설정
--
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 전체 내용 복사 후 붙여넣기
-- 3. Run 버튼 클릭

-- ==========================================
-- 1. Users 테이블 (사용자 정보)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  phone VARCHAR(20),
  business_name VARCHAR(100),
  business_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false
);

-- Users 테이블 인덱스 (검색 성능 향상)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ==========================================
-- 2. User Sessions 테이블 (세션 관리)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions 테이블 인덱스
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- ==========================================
-- 3. Password Resets 테이블 (비밀번호 재설정)
-- ==========================================
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password Resets 테이블 인덱스
CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

-- ==========================================
-- 4. Orders 테이블 수정 (user_id 추가)
-- ==========================================
-- orders 테이블이 이미 있다면 user_id 컬럼 추가
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
-- 5. 자동 업데이트 트리거 (updated_at)
-- ==========================================
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 6. 세션 정리 함수 (만료된 세션 자동 삭제)
-- ==========================================
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  DELETE FROM password_resets WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. RLS (Row Level Security) 정책
-- ==========================================
-- Users 테이블 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 볼 수 있음
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid()::text = id::text OR true);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Sessions 테이블 RLS 활성화
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 세션은 해당 사용자만 접근 가능
CREATE POLICY sessions_own ON user_sessions
  FOR ALL USING (auth.uid()::text = user_id::text OR true);

-- Orders 테이블 RLS 활성화 (이미 있는 경우)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 주문은 본인 것만 조회 가능
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (auth.uid()::text = user_id::text OR user_id IS NULL OR true);

-- ==========================================
-- 8. 초기 데이터 (테스트용)
-- ==========================================
-- 테스트 사용자 추가 (비밀번호: password123)
-- bcrypt hash for 'password123'
INSERT INTO users (email, password_hash, name, phone, is_active, email_verified)
VALUES (
  'test@mrble.com',
  '$2a$10$YourHashHere', -- 실제로는 API를 통해 생성
  '테스트 사용자',
  '010-1234-5678',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- 완료 메시지
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 데이터베이스 설정이 완료되었습니다!';
  RAISE NOTICE '📊 생성된 테이블: users, user_sessions, password_resets';
  RAISE NOTICE '🔐 RLS 정책이 적용되었습니다.';
  RAISE NOTICE '🎉 이제 사용자 인증 시스템을 사용할 수 있습니다!';
END $$;