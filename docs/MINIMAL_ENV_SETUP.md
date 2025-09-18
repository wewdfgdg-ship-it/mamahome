# 🔧 최소 환경변수 설정 가이드

기존 Supabase를 사용하시는 경우, 다음 환경변수만 추가하면 됩니다.

## 📋 필요한 환경변수 (5개)

### 1️⃣ Supabase 연결 정보 (이미 있을 수 있음)
```
SUPABASE_URL = "https://xxxxx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGci..."
SUPABASE_SERVICE_KEY = "eyJhbGci..."
```

### 2️⃣ JWT 토큰 시크릿 (새로 추가 필요)
```
JWT_SECRET = "mrble-jwt-secret-key-2024-production-secure"
JWT_REFRESH_SECRET = "mrble-refresh-secret-key-2024-production-secure"
```

## 🚀 Vercel 설정 방법

1. **Vercel 대시보드 접속**
   - https://vercel.com 로그인
   - "mamahome-five" 프로젝트 선택

2. **Settings → Environment Variables**

3. **JWT 환경변수 추가** (이것만 추가하면 됨!)

   **JWT_SECRET 추가:**
   - Key: `JWT_SECRET`
   - Value: `mrble-jwt-secret-key-2024-production-secure` (또는 원하는 값)
   - Environment: Production, Preview, Development 모두 체크
   - Save 클릭

   **JWT_REFRESH_SECRET 추가:**
   - Key: `JWT_REFRESH_SECRET`
   - Value: `mrble-refresh-secret-key-2024-production-secure` (또는 원하는 값)
   - Environment: Production, Preview, Development 모두 체크
   - Save 클릭

4. **재배포**
   - Deployments 탭으로 이동
   - 최근 배포 옆 "..." 클릭
   - "Redeploy" 선택

## ✅ 확인사항

### Supabase에서 확인:
- [ ] `users` 테이블 존재 (이미 있음 ✓)
- [ ] `orders` 테이블 존재 (이미 있음 ✓)
- [ ] `user_sessions` 테이블 추가 필요 (add-session-table.sql 실행)

### Vercel에서 확인:
- [ ] SUPABASE_URL 설정됨 (이미 있을 것)
- [ ] SUPABASE_ANON_KEY 설정됨 (이미 있을 것)
- [ ] SUPABASE_SERVICE_KEY 설정됨 (이미 있을 것)
- [ ] JWT_SECRET 추가 필요 ⚠️
- [ ] JWT_REFRESH_SECRET 추가 필요 ⚠️

## 🔑 JWT 시크릿 생성 팁

더 안전한 시크릿을 원하시면:

### 방법 1: 온라인 생성기
https://www.grc.com/passwords.htm 에서 생성

### 방법 2: Node.js로 생성
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 방법 3: OpenSSL로 생성
```bash
openssl rand -hex 32
```

## 🎯 다음 단계

1. **세션 테이블 추가**
   - Supabase SQL Editor에서 `add-session-table.sql` 실행

2. **JWT 환경변수 추가**
   - Vercel에 JWT_SECRET, JWT_REFRESH_SECRET 추가

3. **재배포**
   - Vercel에서 Redeploy

4. **테스트**
   - /pages/register.html 에서 회원가입
   - /login.html 에서 로그인

완료! 이제 사용자 인증이 작동합니다 🎉