-- RLS (Row Level Security) 수정 스크립트

-- 1. orders 테이블 RLS 비활성화 (임시로 모든 접근 허용)
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 2. users 테이블 RLS 비활성화 (임시로 모든 접근 허용)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. user_sessions 테이블 RLS 비활성화 (임시로 모든 접근 허용)
ALTER TABLE public.user_sessions DISABLE ROW LEVEL SECURITY;

-- 또는 RLS를 활성화하되 모든 사용자가 접근 가능하도록 정책 설정
-- (보안이 필요한 경우 아래 코드 사용)

/*
-- orders 테이블 RLS 활성화 및 정책 설정
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.orders;

-- 새로운 정책 생성 (anon 사용자도 접근 가능)
CREATE POLICY "Allow anonymous read access" ON public.orders
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous insert" ON public.orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON public.orders
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON public.orders
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- users 테이블도 동일하게 처리
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Allow anonymous read access" ON public.users
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous insert" ON public.users
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON public.users
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- user_sessions 테이블도 동일하게 처리
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON public.user_sessions
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow anonymous insert" ON public.user_sessions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON public.user_sessions
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON public.user_sessions
    FOR DELETE
    TO anon, authenticated
    USING (true);
*/