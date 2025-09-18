# 📚 Meble Blog - Notion API 연동 가이드

## ✅ 현재 완성된 시스템

### 1. **Notion을 CMS로 사용**
- Notion에서 글 작성/수정
- API로 데이터만 가져옴
- 커스텀 디자인으로 표시

### 2. **구성 요소**
```
press.html (카드 리스트) 
    ↓ 클릭
blog-detail.html (상세 페이지)
    ↓ API 호출
server.js (Express 서버)
    ↓ Notion API
Notion Database (콘텐츠 저장소)
```

## 🚀 실행 방법

### 1. **패키지 설치**
```bash
cd C:\Users\tip12\Documents\vvv
npm install
```

### 2. **.env 파일 수정**
```env
NOTION_API_KEY=secret_실제_API_KEY
NOTION_DATABASE_ID=실제_DATABASE_ID
```

### 3. **서버 실행**
```bash
npm start
# 또는
node server.js
```

### 4. **브라우저에서 확인**
```
http://localhost:3000/pages/press.html
```

## 📝 Notion Database 구조

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| Title (제목) | Title | 글 제목 |
| Slug | Text | URL 경로 |
| Category | Select | 카테고리 |
| Tags | Multi-select | 태그들 |
| Excerpt | Text | 요약 |
| Published | Checkbox | 발행 여부 |
| PublishedDate | Date | 발행일 |
| Thumbnail | Files | 썸네일 이미지 |
| Author | Person | 작성자 |

## 🔧 파일 구조

```
vvv/
├── server.js           # Express 서버
├── notion-test.js      # Notion API 테스트
├── package.json        # 패키지 정보
├── .env               # 환경 변수 (API 키)
├── .env.example       # 환경 변수 템플릿
├── lib/
│   └── notion.js      # Notion API 함수들
├── pages/
│   ├── press.html     # 블로그 목록 페이지
│   └── blog-detail.html # 블로그 상세 페이지
└── notion-setup.md    # 설정 가이드
```

## 📌 주요 기능

### 1. **자동 목차 생성**
- H2, H3, H4 태그에서 자동 추출
- 좌측 사이드바에 고정
- 스크롤 시 현재 위치 하이라이트

### 2. **Markdown → HTML 변환**
- Notion 콘텐츠를 Markdown으로 변환
- marked.js로 HTML 렌더링

### 3. **관련 글 추천**
- 같은 카테고리 글 자동 표시
- 최대 2개까지 표시

## 🎯 사용 흐름

1. **Notion에서 글 작성**
   - Database에 새 항목 추가
   - 내용 작성
   - Published 체크

2. **press.html에서 카드 클릭**
   - 카드 제목과 slug 매핑
   - blog-detail.html?slug=xxx로 이동

3. **blog-detail.html에서 콘텐츠 표시**
   - API 호출로 Notion 데이터 가져오기
   - 커스텀 디자인으로 렌더링
   - 목차, 공유 버튼 등 추가 기능

## 🔐 보안 주의사항

- `.env` 파일은 절대 공개하지 마세요
- API Key는 서버에서만 사용
- 프론트엔드에서 직접 Notion API 호출 금지

## 🐛 문제 해결

### "연결 실패" 에러
1. API Key 확인
2. Database ID 확인
3. Integration이 Database에 연결되었는지 확인

### "Post not found" 에러
1. Slug가 정확한지 확인
2. Published가 체크되어 있는지 확인
3. Notion에서 글이 실제로 있는지 확인

## 📧 문의
미블(Meble) - 010-7362-7711 
