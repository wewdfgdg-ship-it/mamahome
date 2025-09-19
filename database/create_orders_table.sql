-- Orders 테이블 생성
-- Mrble 체험단 서비스 주문 정보 저장
--
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor
-- 2. 이 전체 내용 복사 후 붙여넣기
-- 3. Run 버튼 클릭

-- ==========================================
-- Orders 테이블 (주문 정보)
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),

  -- 고객 정보
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  business_name VARCHAR(100),
  business_number VARCHAR(20),

  -- 상품 정보
  package_name VARCHAR(200),
  package_price DECIMAL(10, 2),

  -- 결제 정보
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'payapp',
  payment_status VARCHAR(50) DEFAULT 'pending',

  -- 상태 관리
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, completed, cancelled
  notes TEXT,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Orders 테이블 인덱스 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- 자동 업데이트 트리거 (updated_at)
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Orders 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- 테이블 생성 확인
SELECT 'Orders table created successfully!' AS message;