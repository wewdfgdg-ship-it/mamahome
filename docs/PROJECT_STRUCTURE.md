# 📁 프로젝트 구조 문서

## 🏗️ 전체 프로젝트 구조

```
mamahome/
├── api/                          # Vercel Functions (백엔드 API)
│   ├── admin-auth.js            # 관리자 인증 API
│   ├── auth.js                  # 사용자 인증 API
│   ├── check-env.js             # 환경변수 체크
│   ├── orders.js                # 주문 관리 API
│   ├── packages.js              # 패키지 관리 API (카테고리/썸네일/가격)
│   ├── payapp-feedback.js      # PayApp 결제 피드백
│   ├── payapp-payments.js      # PayApp 결제 처리
│   ├── payapp-proxy.js         # PayApp 프록시
│   ├── payment-redirect.js     # 결제 리다이렉트
│   ├── upload-image.js         # 이미지 업로드 API
│   └── users.js                 # 회원 관리 API
│
├── admin/                        # 관리자 패널
│   ├── index.html               # 메인 HTML (1100줄)
│   ├── index-backup.html        # 백업 (원본 4000줄)
│   ├── css/
│   │   └── admin.css            # 모든 스타일 (630줄)
│   └── js/
│       ├── app.js               # 메인 앱 로직 (450줄)
│       ├── utils.js             # 유틸리티 함수 (200줄)
│       └── modules/
│           ├── categories.js   # 카테고리 CRUD (300줄)
│           ├── thumbnails.js   # 썸네일 CRUD (300줄)
│           └── upload.js       # 이미지 업로드 (250줄)
│
├── components/                   # 재사용 컴포넌트
│   └── ui/                      # UI 컴포넌트
│       ├── Badge.js
│       ├── Button.js
│       ├── Card.js
│       ├── Container.js
│       ├── Divider.js
│       ├── Grid.js
│       ├── Link.js
│       ├── Loader.js
│       └── Typography.js
│
├── pages/                        # 사용자 페이지
│   ├── checkout.html            # 결제 페이지
│   ├── my-info.html            # 마이페이지
│   ├── package-detail.html     # 패키지 상세
│   └── signup.html             # 회원가입
│
├── styles/                       # 전역 스타일
│   ├── common.css
│   ├── common-header.css
│   └── home.css
│
├── js/                          # 프론트엔드 스크립트
│   ├── signup.js
│   └── common-header.js
│
├── .env                         # 환경변수 (비공개)
├── .gitignore                   # Git 제외 파일
├── config.js                    # 설정 파일
├── index.html                   # 메인 홈페이지
├── package.json                 # 프로젝트 설정
├── vercel.json                  # Vercel 배포 설정
├── CLAUDE.md                    # 프로젝트 개발 규칙
└── PROJECT_STRUCTURE.md         # 이 문서

```

## 🔗 모듈 의존성

### admin/js/ 모듈 로딩 순서
1. `utils.js` - 전역 유틸리티 함수 (독립적)
2. `modules/categories.js` - 카테고리 모듈 (utils 의존)
3. `modules/thumbnails.js` - 썸네일 모듈 (utils 의존)
4. `modules/upload.js` - 업로드 모듈 (utils 의존)
5. `app.js` - 메인 앱 (모든 모듈 의존)

## 📊 데이터베이스 구조 (Supabase)

### 테이블 구조
```sql
-- 카테고리 (categories)
├── id (bigint, PK)
├── name (text)
├── slug (text, UNIQUE)
├── description (text)
├── display_order (integer)
├── is_active (boolean)
└── created_at (timestamp)

-- 썸네일 (thumbnails)
├── id (bigint, PK)
├── category_id (bigint, FK)
├── title (text)
├── subtitle (text)
├── description (text)
├── thumbnail_url (text)
├── text_color (text)
├── text_size (text)
├── is_active (boolean)
└── created_at (timestamp)

-- 상세페이지 (detail_pages)
├── id (bigint, PK)
├── thumbnail_id (bigint, FK, UNIQUE)
├── content_images (text[])
├── content_html (text)
├── text_styles (jsonb)
├── background_color (text)
├── text_alignment (text)
└── created_at (timestamp)

-- 가격 (prices)
├── id (bigint, PK)
├── category_id (bigint, FK)
├── option_name (text)
├── number_of_people (integer)
├── original_price (numeric)
├── discounted_price (numeric)
├── discount_rate (integer)
├── badge_text (text)
├── display_order (integer)
├── is_active (boolean)
└── created_at (timestamp)

-- 주문 (orders)
├── id (bigint, PK)
├── order_number (text, UNIQUE)
├── customer_name (text)
├── customer_email (text)
├── customer_phone (text)
├── business_name (text)
├── business_number (text)
├── industry_type (text)
├── package_name (text)
├── package_price (numeric)
├── amount (numeric)
├── status (text)
└── created_at (timestamp)
```

## 🚀 배포 정보

### Vercel 설정
- **Production URL**: https://mamahome-[hash].vercel.app
- **Admin Panel**: /admin
- **API Routes**: /api/*
- **Static Files**: 자동 서빙

### 환경변수
```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-key]
```

## 🛠️ 개발 명령어

```bash
# 로컬 개발
npm run dev

# 프로덕션 배포
npm run deploy

# 의존성 설치
npm install
```

## 📝 코드 컨벤션

### JavaScript
- ES6+ 문법 사용
- async/await 패턴 권장
- 함수명: camelCase
- 상수명: UPPER_SNAKE_CASE

### CSS
- Apple Design System 색상 사용
- rgb() 함수 사용 (hex 대신)
- 반응형: 모바일 우선

### HTML
- 시맨틱 태그 사용
- 인라인 스타일 최소화
- 컴포넌트 재사용 우선

## 🔄 최근 변경사항

### 2025-01-26
- admin/index.html 모듈화 (4000줄 → 1100줄)
- CSS 분리 (admin.css)
- JavaScript 모듈 분리 (categories, thumbnails, upload)
- 이미지 드래그 앤 드롭 기능 추가

## 📌 중요 참고사항

1. **4단계 계층 구조**: 카테고리 → 썸네일 → 상세페이지 → 가격
2. **이미지 업로드**: Supabase Storage 사용
3. **인증**: JWT 토큰 기반
4. **UI 컴포넌트**: Apple Design System 준수
5. **반응형**: 모바일 최적화 필수

## 🎯 TODO

- [ ] 상세페이지 모듈 분리 (details.js)
- [ ] 가격 모듈 분리 (prices.js)
- [ ] TypeScript 도입
- [ ] 번들링 최적화 (Webpack/Vite)
- [ ] 테스트 코드 작성
- [ ] API 문서화 (Swagger)

---

*이 문서는 프로젝트 구조가 변경될 때마다 업데이트되어야 합니다.*