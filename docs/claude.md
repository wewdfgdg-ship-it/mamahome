# 🎨 상공(SANGGONG) 테마 컴포넌트 시스템 규칙

## 📋 프로젝트 개요
이 프로젝트는 상공(SANGGONG) 웹사이트의 디자인 시스템을 기반으로 합니다.
모든 UI 컴포넌트는 이 문서에 정의된 규칙을 따라야 합니다.

## 🔴 필수 준수사항

### 1. 테마 변수 사용 (MANDATORY)
**절대 하드코딩 금지!** 모든 스타일 값은 아래 CSS 변수를 사용해야 합니다.

```css
/* ✅ 올바른 사용 */
color: var(--color-primary-main);
padding: var(--spacing-md);

/* ❌ 잘못된 사용 */
color: rgb(41, 212, 193);
padding: 24px;
```

## 🎨 테마 시스템

### 색상 팔레트
```css
:root {
    /* Primary Colors - 주요 브랜드 색상 */
    --color-primary-main: rgb(41, 212, 193);  /* 민트 그린 - CTA, 강조 */
    --color-primary-dark: rgb(46, 46, 47);    /* 다크 그레이 - 헤더, 제목 */
    --color-primary-light: rgb(102, 102, 102); /* 라이트 그레이 - 보조 */
    
    /* Background Colors - 배경색 */
    --color-bg-primary: rgb(255, 255, 255);    /* 흰색 - 메인 배경 */
    --color-bg-secondary: rgb(0, 0, 0);        /* 검정 - 다크 섹션 */
    --color-bg-overlay: rgba(0, 0, 0, 0.8);    /* 오버레이 */
    
    /* Text Colors - 텍스트 색상 */
    --color-text-primary: rgb(32, 33, 31);     /* 메인 텍스트 */
    --color-text-secondary: rgb(153, 153, 153); /* 보조 텍스트 */
    --color-text-light: rgb(255, 255, 255);    /* 밝은 배경용 텍스트 */
    --color-text-muted: rgb(189, 189, 189);    /* 비활성 텍스트 */
    
    /* Accent Colors - 강조 색상 */
    --color-accent-highlight: rgb(253, 249, 207); /* 하이라이트 */
    --color-accent-hover: rgb(41, 212, 193);     /* 호버 효과 */
}
```

### 타이포그래피
```css
:root {
    /* Font Families */
    --font-primary: 'Noto Sans KR', sans-serif;    /* 한글 본문 */
    --font-secondary: 'Poppins', sans-serif;       /* 영문 제목 */
    --font-tertiary: 'Montserrat', sans-serif;     /* 영문 보조 */
}
```

### 간격 시스템
```css
:root {
    --spacing-xs: 8px;    /* 최소 간격 */
    --spacing-sm: 16px;   /* 작은 간격 */
    --spacing-md: 24px;   /* 중간 간격 */
    --spacing-lg: 32px;   /* 큰 간격 */
    --spacing-xl: 48px;   /* 특대 간격 */
    --spacing-2xl: 64px;  /* 섹션 간격 (소) */
    --spacing-3xl: 100px; /* 섹션 간격 (중) */
    --spacing-4xl: 200px; /* 섹션 간격 (대) */
}
```

## 📦 컴포넌트 사용 규칙

### 1. 타이포그래피 컴포넌트

#### 제목 사용 규칙
```html
<!-- 페이지 메인 타이틀 -->
<h1 class="heading-1">MAIN TITLE</h1>

<!-- 섹션 타이틀 -->
<h2 class="heading-2">Section Title</h2>

<!-- 서브 타이틀 -->
<h3 class="heading-3">Sub Title</h3>

<!-- 카드/아이템 타이틀 -->
<h4 class="heading-4">Card Title</h4>

<!-- 작은 제목/라벨 -->
<h5 class="heading-5">Small Title</h5>
```

#### 본문 텍스트
```html
<!-- 일반 본문 -->
<p class="text-body">본문 내용입니다.</p>

<!-- 작은 텍스트 (캡션, 부가설명) -->
<p class="text-small">부가 설명 텍스트</p>

<!-- 강조 텍스트 -->
<span class="text-highlight">강조할 내용</span>
```

### 2. 버튼 컴포넌트

#### 버튼 종류별 사용처
```html
<!-- Primary: 주요 행동 유도 (CTA) -->
<button class="btn btn-primary">구매하기</button>
<button class="btn btn-primary">시작하기</button>

<!-- Secondary: 보조 액션 -->
<button class="btn btn-secondary">더 알아보기</button>
<button class="btn btn-secondary">다운로드</button>

<!-- Outline: 취소, 뒤로가기 등 -->
<button class="btn btn-outline">취소</button>
<button class="btn btn-outline">돌아가기</button>
```

#### 버튼 크기
```html
<!-- 히어로 섹션, 중요 CTA -->
<button class="btn btn-primary btn-large">지금 시작하기</button>

<!-- 일반 버튼 -->
<button class="btn btn-primary">확인</button>

<!-- 카드 내부, 인라인 버튼 -->
<button class="btn btn-primary btn-small">자세히</button>
```

### 3. 카드 컴포넌트

#### 기본 카드 구조
```html
<div class="card">
    <img src="..." alt="..." class="card-image">
    <div class="card-content">
        <h3 class="card-title">카드 제목</h3>
        <p class="card-description">카드 설명</p>
        <button class="btn btn-primary btn-small">더보기</button>
    </div>
</div>
```

#### 오버레이 카드
```html
<div class="card">
    <img src="..." alt="..." class="card-image">
    <div class="card-content">
        <!-- 기본 내용 -->
    </div>
    <div class="card-overlay">
        <!-- 호버시 표시될 내용 -->
    </div>
</div>
```

### 4. 폼 컴포넌트

#### 폼 필드 구조
```html
<div class="form-group">
    <label class="form-label">라벨</label>
    <input type="text" class="form-input" placeholder="플레이스홀더">
    <span class="form-help">도움말 텍스트</span>
</div>
```

#### 폼 레이아웃
```html
<form class="form">
    <div class="grid grid-2">
        <div class="form-group"><!-- 필드 1 --></div>
        <div class="form-group"><!-- 필드 2 --></div>
    </div>
    <div class="form-group">
        <textarea class="form-textarea"></textarea>
    </div>
    <button class="btn btn-primary">제출</button>
</form>
```

### 5. 네비게이션 컴포넌트

#### 헤더 네비게이션
```html
<nav class="navigation">
    <div class="nav-container">
        <a href="#" class="nav-logo">LOGO</a>
        <ul class="nav-menu">
            <li class="nav-item">
                <a href="#" class="nav-link active">메뉴1</a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link">메뉴2</a>
            </li>
        </ul>
    </div>
</nav>
```

### 6. 레이아웃 시스템

#### 컨테이너
```html
<!-- 최대 너비 1172px 중앙 정렬 컨테이너 -->
<div class="container">
    <!-- 콘텐츠 -->
</div>
```

#### 섹션
```html
<!-- 큰 섹션 (200px 패딩) -->
<section class="section section-large">...</section>

<!-- 중간 섹션 (100px 패딩) -->
<section class="section section-medium">...</section>

<!-- 작은 섹션 (64px 패딩) -->
<section class="section section-small">...</section>
```

#### 그리드 시스템
```html
<!-- 2 컬럼 -->
<div class="grid grid-2">
    <div>컬럼 1</div>
    <div>컬럼 2</div>
</div>

<!-- 3 컬럼 -->
<div class="grid grid-3">
    <div>컬럼 1</div>
    <div>컬럼 2</div>
    <div>컬럼 3</div>
</div>

<!-- 4 컬럼 -->
<div class="grid grid-4">
    <div>컬럼 1</div>
    <div>컬럼 2</div>
    <div>컬럼 3</div>
    <div>컬럼 4</div>
</div>
```

## 🎯 사용 가이드라인

### DO's ✅
1. **항상 정의된 컴포넌트 클래스 사용**
   ```html
   <button class="btn btn-primary">올바른 사용</button>
   ```

2. **CSS 변수로 커스텀 스타일 적용**
   ```css
   .custom-element {
       background-color: var(--color-primary-main);
       padding: var(--spacing-md);
   }
   ```

3. **유틸리티 클래스 활용**
   ```html
   <div class="text-center mb-lg mt-sm">
       중앙 정렬, 마진 적용
   </div>
   ```

4. **반응형을 고려한 그리드 사용**
   ```html
   <div class="grid grid-3">
       <!-- 모바일에서 자동으로 1컬럼으로 변경됨 -->
   </div>
   ```

### DON'Ts ❌
1. **인라인 스타일 사용 금지**
   ```html
   <!-- 잘못된 예 -->
   <div style="color: rgb(41, 212, 193);">❌</div>
   ```

2. **임의의 색상값 사용 금지**
   ```css
   /* 잘못된 예 */
   .custom { color: #29d4c1; } /* ❌ */
   ```

3. **정의되지 않은 폰트 사용 금지**
   ```css
   /* 잘못된 예 */
   .custom { font-family: 'Arial'; } /* ❌ */
   ```

4. **임의의 간격값 사용 금지**
   ```css
   /* 잘못된 예 */
   .custom { margin: 25px; } /* ❌ */
   ```

## 📱 반응형 디자인 규칙

### 브레이크포인트
- **모바일**: ~767px
- **태블릿**: 768px ~ 1024px  
- **데스크톱**: 1025px ~

### 반응형 적용 예시
```css
/* 데스크톱 우선 */
.element {
    font-size: 100px;
}

@media (max-width: 1024px) {
    .element {
        font-size: 70px; /* 태블릿 */
    }
}

@media (max-width: 767px) {
    .element {
        font-size: 50px; /* 모바일 */
    }
}
```

## 🎭 애니메이션 사용

### 기본 애니메이션 클래스
```html
<!-- 페이드인 -->
<div class="animate-fadeIn">콘텐츠</div>

<!-- 좌측 슬라이드 -->
<div class="animate-slideInLeft">콘텐츠</div>

<!-- 우측 슬라이드 -->
<div class="animate-slideInRight">콘텐츠</div>

<!-- 펄스 효과 -->
<button class="btn btn-primary animate-pulse">버튼</button>
```

### 트랜지션
```css
/* 정의된 트랜지션 사용 */
.element {
    transition: var(--transition-default);  /* 0.3s ease */
    transition: var(--transition-fast);     /* 0.2s cubic-bezier */
    transition: var(--transition-slow);     /* 0.5s ease-in-out */
}
```

## 🚀 프로젝트 적용 체크리스트

- [ ] CSS 변수 정의 파일 포함
- [ ] 필요한 폰트 로드 (Noto Sans KR, Poppins, Montserrat)
- [ ] 기본 스타일 리셋 적용
- [ ] 컴포넌트 CSS 파일 포함
- [ ] 유틸리티 클래스 정의
- [ ] 반응형 미디어 쿼리 설정
- [ ] 애니메이션 키프레임 정의

## 📝 코드 리뷰 체크포인트

프로젝트 코드 작성 및 리뷰시 다음 사항을 확인:

1. **색상**: 모든 색상이 CSS 변수를 사용하는가?
2. **간격**: padding, margin이 spacing 변수를 사용하는가?
3. **타이포그래피**: 정의된 heading 클래스를 사용하는가?
4. **버튼**: btn 클래스와 modifier를 올바르게 사용하는가?
5. **레이아웃**: grid 시스템을 활용하는가?
6. **반응형**: 모바일 대응이 되어있는가?
7. **일관성**: 전체적으로 디자인 시스템을 따르는가?

## 🔧 커스터마이징

### 새로운 컴포넌트 추가시
```css
/* 기존 변수를 활용한 새 컴포넌트 */
.new-component {
    /* 색상은 반드시 변수 사용 */
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    
    /* 간격도 변수 사용 */
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    
    /* 트랜지션도 변수 사용 */
    transition: var(--transition-default);
    
    /* 폰트도 변수 사용 */
    font-family: var(--font-primary);
}
```

### 특별한 경우의 예외 처리
예외가 필요한 경우, 반드시 주석으로 이유를 명시:
```css
.special-case {
    /* EXCEPTION: 디자이너 요청으로 특별한 색상 적용 - 2024.01.15 */
    color: #special-color;
}
```

---

## 📌 중요 참고사항

**이 규칙은 프로젝트의 일관성과 유지보수성을 위해 반드시 준수되어야 합니다.**

모든 개발자와 디자이너는 이 문서를 숙지하고, 
새로운 컴포넌트 추가시 이 문서를 업데이트해야 합니다.

버전: 1.0.0
최종 수정일: 2024.01.15
작성자: SANGGONG Theme System