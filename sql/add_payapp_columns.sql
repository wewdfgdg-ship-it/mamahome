-- payapp_payments 테이블에 필요한 컬럼들 추가
-- 기존 테이블이 있는 경우 컬럼만 추가

-- PayApp 고유 정보
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS mul_no VARCHAR(100) UNIQUE NOT NULL;
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS order_id VARCHAR(100);

-- 결제 정보
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS state VARCHAR(10);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS pay_state VARCHAR(10);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS goodname TEXT;

-- 구매자 정보
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS buyer VARCHAR(100);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS recvphone VARCHAR(50);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS memo TEXT;

-- 영수증 URL (가장 중요!)
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS payurl TEXT;

-- 결제 상세
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS pay_type VARCHAR(50);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS pay_date VARCHAR(50);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS card_name VARCHAR(100);
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS payauthcode VARCHAR(100);

-- 추가 변수
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS var1 TEXT;
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS var2 TEXT;

-- 원본 데이터 (디버깅용)
ALTER TABLE payapp_payments ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- 인덱스 생성 (없는 경우만)
CREATE INDEX IF NOT EXISTS idx_payapp_mul_no ON payapp_payments(mul_no);
CREATE INDEX IF NOT EXISTS idx_payapp_created_at ON payapp_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payapp_order_id ON payapp_payments(order_id);