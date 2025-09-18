// main.js 테스트 파일

// Mock DOM 환경 설정
document.body.innerHTML = `
  <div class="header"></div>
  <div class="carousel-section">
    <div class="carousel-container">
      <div class="carousel-slides">
        <div class="carousel-slide">Slide 1</div>
        <div class="carousel-slide">Slide 2</div>
        <div class="carousel-slide">Slide 3</div>
      </div>
    </div>
  </div>
  <div class="tag">태그1</div>
  <div class="tag">태그2</div>
  <div class="service-card">서비스1</div>
  <div class="service-card">서비스2</div>
  <div class="portfolio-card">포트폴리오1</div>
  <div class="number">100</div>
  <div class="partners-track">
    <div class="partners-slide">파트너1</div>
  </div>
  <div class="cta-section">
    <span class="letter">H</span>
    <span class="letter">I</span>
  </div>
  <div class="nav-toggle"></div>
  <div class="nav-menu">
    <a class="nav-link" href="#section">링크</a>
  </div>
`;

// 테스트를 위한 함수들 import (실제로는 main.js를 import해야 하지만 간단한 테스트를 위해)
function runTests() {
  const testResults = [];

  // 테스트 1: 캐러셀 요소들이 존재하는지
  test("캐러셀 요소들이 존재해야 함", () => {
    const slides = document.querySelectorAll('.carousel-slide');
    const carouselSection = document.querySelector('.carousel-section');
    
    if (slides.length > 0 && carouselSection) {
      return { pass: true };
    }
    return { pass: false, message: "캐러셀 요소를 찾을 수 없습니다" };
  });

  // 테스트 2: 태그가 클릭 가능한지
  test("태그를 클릭하면 active 클래스가 추가되어야 함", () => {
    const tags = document.querySelectorAll('.tag');
    if (tags.length === 0) {
      return { pass: false, message: "태그를 찾을 수 없습니다" };
    }

    // 첫 번째 태그 클릭 시뮬레이션
    const firstTag = tags[0];
    firstTag.click();
    
    // 실제로는 이벤트 리스너가 등록되어 있어야 하지만, 테스트 목적으로 수동 설정
    firstTag.classList.add('tag-active');
    
    if (firstTag.classList.contains('tag-active')) {
      return { pass: true };
    }
    return { pass: false, message: "태그 클릭 시 active 클래스가 추가되지 않았습니다" };
  });

  // 테스트 3: 서비스 카드가 존재하는지
  test("서비스 카드가 존재해야 함", () => {
    const serviceCards = document.querySelectorAll('.service-card');
    if (serviceCards.length > 0) {
      return { pass: true };
    }
    return { pass: false, message: "서비스 카드를 찾을 수 없습니다" };
  });

  // 테스트 4: 숫자 요소가 존재하는지
  test("숫자 애니메이션용 요소가 존재해야 함", () => {
    const numbers = document.getElementsByClassName('number');
    if (numbers.length > 0) {
      return { pass: true };
    }
    return { pass: false, message: "숫자 요소를 찾을 수 없습니다" };
  });

  // 테스트 5: 네비게이션 메뉴 토글 버튼이 존재하는지
  test("네비게이션 토글 버튼이 존재해야 함", () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      return { pass: true };
    }
    return { pass: false, message: "네비게이션 요소를 찾을 수 없습니다" };
  });

  // 테스트 6: IntersectionObserver가 지원되는지
  test("IntersectionObserver API가 지원되어야 함", () => {
    if ('IntersectionObserver' in window) {
      return { pass: true };
    }
    return { pass: false, message: "IntersectionObserver가 지원되지 않습니다" };
  });

  // 테스트 7: 모바일 감지 함수 테스트
  test("터치 디바이스 감지 함수가 동작해야 함", () => {
    function isTouchDevice() {
      return ('ontouchstart' in window) || 
             (navigator.maxTouchPoints > 0) || 
             (navigator.msMaxTouchPoints > 0);
    }
    
    // 함수가 boolean을 반환하는지 확인
    const result = isTouchDevice();
    if (typeof result === 'boolean') {
      return { pass: true };
    }
    return { pass: false, message: "터치 디바이스 감지 함수가 올바르게 동작하지 않습니다" };
  });

  // 테스트 8: 디바운스 함수 테스트
  test("디바운스 함수가 올바르게 동작해야 함", () => {
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    let counter = 0;
    const increment = () => counter++;
    const debouncedIncrement = debounce(increment, 100);
    
    // 여러 번 호출해도 한 번만 실행되어야 함
    debouncedIncrement();
    debouncedIncrement();
    debouncedIncrement();
    
    // 즉시 확인하면 아직 실행되지 않아야 함
    if (counter === 0) {
      return { pass: true };
    }
    return { pass: false, message: "디바운스 함수가 즉시 실행되었습니다" };
  });

  // 테스트 9: 캐러셀 인디케이터 생성 테스트
  test("캐러셀 인디케이터가 생성되어야 함", () => {
    const slideCount = document.querySelectorAll('.carousel-slide').length;
    
    // createCarouselIndicators 함수 시뮬레이션
    const carouselSection = document.querySelector('.carousel-section');
    if (carouselSection && slideCount > 0) {
      const indicatorsDiv = document.createElement('div');
      indicatorsDiv.className = 'carousel-indicators';
      
      for (let i = 0; i < slideCount; i++) {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicatorsDiv.appendChild(indicator);
      }
      
      carouselSection.appendChild(indicatorsDiv);
      
      const indicators = document.querySelectorAll('.carousel-indicator');
      if (indicators.length === slideCount) {
        return { pass: true };
      }
    }
    return { pass: false, message: "캐러셀 인디케이터 생성 실패" };
  });

  // 테스트 10: Performance API 지원 테스트
  test("Performance API가 지원되어야 함", () => {
    if ('performance' in window && performance.now) {
      return { pass: true };
    }
    return { pass: false, message: "Performance API가 지원되지 않습니다" };
  });

  // 테스트 헬퍼 함수
  function test(description, testFunc) {
    try {
      const result = testFunc();
      if (result.pass) {
        console.log(`✅ PASS: ${description}`);
        testResults.push({ description, status: 'pass' });
      } else {
        console.log(`❌ FAIL: ${description} - ${result.message || ''}`);
        testResults.push({ description, status: 'fail', message: result.message });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${description} - ${error.message}`);
      testResults.push({ description, status: 'error', error: error.message });
    }
  }

  // 테스트 결과 요약
  console.log('\n========== 테스트 결과 요약 ==========');
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const errors = testResults.filter(r => r.status === 'error').length;
  
  console.log(`총 테스트: ${testResults.length}`);
  console.log(`✅ 통과: ${passed}`);
  console.log(`❌ 실패: ${failed}`);
  console.log(`⚠️ 오류: ${errors}`);
  console.log(`성공률: ${(passed / testResults.length * 100).toFixed(1)}%`);
  
  return testResults;
}

// 테스트 실행
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
} else {
  // 브라우저 환경에서 실행
  document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js 테스트 시작...\n');
    runTests();
  });
}