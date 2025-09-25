-- PayApp 결제 정보 전용 테이블 생성
-- PayApp Feedback으로 받은 데이터를 저장하는 테이블

CREATE TABLE IF NOT EXISTS payapp_payments (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- PayApp 고유 정보
    mul_no VARCHAR(100) UNIQUE NOT NULL,  -- PayApp 결제 고유번호 (중복 방지)
    order_id VARCHAR(100),  -- 주문번호

    -- 결제 정보
    state VARCHAR(10),  -- 결제 상태
    pay_state VARCHAR(10),  -- 결제 상태 (신형)
    price INTEGER,  -- 결제 금액
    goodname TEXT,  -- 상품명

    -- 구매자 정보 (PayApp에서 받은 정보만)
    buyer VARCHAR(100),  -- 구매자명
    recvphone VARCHAR(50),  -- 수신자 전화번호
    email VARCHAR(255),  -- 이메일
    memo TEXT,  -- 메모

    -- 영수증 URL (가장 중요!)
    receipt_url TEXT,  -- CSTURL 또는 receipturl
    payurl TEXT,  -- 결제 페이지 URL

    -- 결제 상세
    pay_type VARCHAR(50),  -- 결제 수단
    pay_date VARCHAR(50),  -- 결제 일시
    card_name VARCHAR(100),  -- 카드사명
    payauthcode VARCHAR(100),  -- 승인번호

    -- 추가 변수
    var1 TEXT,  -- 추가 데이터 1
    var2 TEXT,  -- 추가 데이터 2

    -- 원본 데이터 (디버깅용)
    raw_data JSONB  -- 받은 전체 데이터 JSON으로 저장
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_payapp_mul_no ON payapp_payments(mul_no);
CREATE INDEX IF NOT EXISTS idx_payapp_created_at ON payapp_payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payapp_order_id ON payapp_payments(order_id);

-- RLS (Row Level Security) 설정
ALTER TABLE payapp_payments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능 (영수증 URL 가져오기 위해)
CREATE POLICY "PayApp payments are viewable by everyone"
ON payapp_payments FOR SELECT
USING (true);

-- 시스템만 삽입 가능 (API를 통해서만)
CREATE POLICY "PayApp payments can only be inserted via API"
ON payapp_payments FOR INSERT
WITH CHECK (true);

-- 코멘트 추가
COMMENT ON TABLE payapp_payments IS 'PayApp 결제 서버 피드백 데이터 저장 테이블';
COMMENT ON COLUMN payapp_payments.mul_no IS 'PayApp 고유 결제번호 - 중복 방지용 UNIQUE KEY';
COMMENT ON COLUMN payapp_payments.receipt_url IS '영수증 URL (CSTURL) - orders 테이블과 연동';