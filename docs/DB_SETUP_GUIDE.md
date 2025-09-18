# 📚 데이터베이스 연결 가이드

## 🚀 빠른 시작 (15분)

### 1단계: Supabase 계정 생성 (3분)

1. **[supabase.com](https://supabase.com) 접속**
2. **"Start your project" 클릭**
3. **GitHub 계정으로 로그인** (또는 이메일 가입)
4. **"New Project" 클릭**
5. **프로젝트 설정:**
   - Project name: `mrble` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 설정 (꼭 저장하세요!)
   - Region: `Northeast Asia (Seoul)` 선택
   - "Create new project" 클릭

### 2단계: 데이터베이스 테이블 생성 (5분)

1. **Supabase Dashboard에서 "SQL Editor" 클릭** (왼쪽 메뉴)
2. **"New query" 클릭**
3. **`database/setup.sql` 파일의 내용 전체 복사**
4. **SQL Editor에 붙여넣기**
5. **"Run" 버튼 클릭** (우측 하단 초록색 버튼)
6. **성공 메시지 확인** ✅

### 3단계: API 키 확인 (2분)

1. **Supabase Dashboard에서 "Settings" 클릭** (왼쪽 하단)
2. **"API" 탭 클릭**
3. **다음 정보 복사:**
   - `Project URL`: https://xxxxx.supabase.co
   - `anon public`: eyJhbGciOiJ... (매우 긴 문자열)
   - `service_role`: eyJhbGciOiJ... (비밀 키 - 안전하게 보관!)

### 4단계: Vercel 환경변수 설정 (5분)

1. **[vercel.com](https://vercel.com) 로그인**
2. **"mamahome-five" 프로젝트 선택**
3. **"Settings" 탭 클릭**
4. **왼쪽 메뉴에서 "Environment Variables" 클릭**
5. **다음 변수 추가:**

```bash
# Supabase 연결 정보
SUPABASE_URL = "https://xxxxx.supabase.co"  # Project URL 붙여넣기
SUPABASE_ANON_KEY = "eyJhbGci..."  # anon public 키 붙여넣기
SUPABASE_SERVICE_KEY = "eyJhbGci..."  # service_role 키 붙여넣기

# JWT 비밀키 (변경 가능)
JWT_SECRET = "mrble-jwt-secret-key-2024-production-secure"
JWT_REFRESH_SECRET = "mrble-refresh-secret-key-2024-production-secure"
```

6. **각 변수마다:**
   - Name과 Value 입력
   - Environment: `Production`, `Preview`, `Development` 모두 체크
   - "Save" 클릭

### 5단계: 재배포 (1분)

```bash
# Git에 변경사항 커밋
git add .
git commit -m "Add database connection and auth system"
git push

# Vercel이 자동으로 재배포합니다
```

또는 Vercel Dashboard에서:
1. "Deployments" 탭
2. 최근 배포 옆 "..." 클릭
3. "Redeploy" 선택

---

## ✅ 확인 방법

### 1. 회원가입 테스트
- https://mamahome-five.vercel.app/pages/register.html 접속
- 새 계정으로 회원가입
- 성공 메시지 확인

### 2. 로그인 테스트
- https://mamahome-five.vercel.app/login.html 접속
- 가입한 계정으로 로그인
- 대시보드로 이동 확인

### 3. Supabase에서 데이터 확인
- Supabase Dashboard → "Table Editor"
- `users` 테이블 선택
- 가입한 사용자 정보 확인

---

## 🔧 문제 해결

### "Failed to fetch" 에러
- **원인**: 환경변수 설정 오류
- **해결**:
  1. Vercel 환경변수 다시 확인
  2. 따옴표 없이 값만 입력했는지 확인
  3. 재배포

### "Invalid API key" 에러
- **원인**: SUPABASE_ANON_KEY 잘못됨
- **해결**: Supabase Dashboard에서 키 다시 복사

### 회원가입은 되는데 로그인 안 됨
- **원인**: JWT_SECRET 불일치
- **해결**:
  1. Vercel 환경변수 확인
  2. 재배포 후 다시 회원가입

### 테이블이 없다는 에러
- **원인**: SQL 스크립트 실행 안 함
- **해결**: `database/setup.sql` 다시 실행

---

## 🎯 성공 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] SQL 스크립트 실행 완료
- [ ] Vercel 환경변수 5개 모두 설정
- [ ] 재배포 완료
- [ ] 회원가입 테스트 성공
- [ ] 로그인 테스트 성공
- [ ] Supabase에서 데이터 확인

---

## 📌 중요 정보

### 환경변수 목록
1. `SUPABASE_URL` - Supabase 프로젝트 URL
2. `SUPABASE_ANON_KEY` - 공개 API 키
3. `SUPABASE_SERVICE_KEY` - 서비스 키 (비밀!)
4. `JWT_SECRET` - JWT 토큰 서명 키
5. `JWT_REFRESH_SECRET` - 리프레시 토큰 키

### 보안 주의사항
- `SUPABASE_SERVICE_KEY`는 절대 공개하지 마세요
- JWT 시크릿은 최소 32자 이상으로 설정
- 프로덕션에서는 더 강력한 비밀키 사용

### 테이블 구조
- `users` - 사용자 정보
- `user_sessions` - 로그인 세션
- `password_resets` - 비밀번호 재설정
- `orders` - 주문 정보 (user_id 추가됨)

---

## 🆘 도움말

문제가 있으시면:
1. 브라우저 개발자 도구 Console 확인 (F12)
2. Vercel Functions 로그 확인
3. Supabase Dashboard 로그 확인

완료되면 실제 사용자 인증이 작동합니다! 🎉