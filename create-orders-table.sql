-- Orders 테이블 생성
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    business_name VARCHAR(255),
    business_number VARCHAR(50),
    package_name VARCHAR(255),
    package_price INTEGER,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);

-- RLS (Row Level Security) 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 생성 (임시)
CREATE POLICY "Enable read access for all users" ON orders
    FOR SELECT USING (true);

-- 모든 사용자가 삽입할 수 있도록 정책 생성 (임시)
CREATE POLICY "Enable insert for all users" ON orders
    FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트할 수 있도록 정책 생성 (임시)
CREATE POLICY "Enable update for all users" ON orders
    FOR UPDATE USING (true);

-- 모든 사용자가 삭제할 수 있도록 정책 생성 (임시)
CREATE POLICY "Enable delete for all users" ON orders
    FOR DELETE USING (true);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();