// 공통 헤더/푸터 로드 및 관리 스크립트

// 헤더와 푸터 로드
async function loadComponents() {
    try {
        // 헤더 로드
        const headerResponse = await fetch('../components/header.html');
        const headerHTML = await headerResponse.text();
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = headerHTML;
        }
        
        // 푸터 로드
        const footerResponse = await fetch('../components/footer.html');
        const footerHTML = await footerResponse.text();
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = footerHTML;
        }
        
        // 컴포넌트 로드 후 초기화
        initializeHeader();
        setActiveMenu();
        
    } catch (error) {
        console.error('컴포넌트 로드 실패:', error);
    }
}

// 헤더 초기화 및 고정 기능
function initializeHeader() {
    const header = document.querySelector('.header-fixed');
    if (!header) return;
    
    // body에 padding-top 추가 (헤더 높이만큼)
    document.body.style.paddingTop = header.offsetHeight + 'px';
    
    // 스크롤 이벤트
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 스크롤 시 헤더 스타일 변경
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    });
    
    // 모바일 메뉴 토글
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // 메뉴 항목 클릭 시 모바일 메뉴 닫기
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// 현재 페이지 메뉴 활성화
function setActiveMenu() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop().replace('.html', '') || 'index';
    
    // 모든 nav-link에서 active 클래스 제거
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 현재 페이지에 해당하는 메뉴 활성화
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        const dataPage = link.getAttribute('data-page');
        
        if (currentPath === '/' || currentPath === '/index.html') {
            // 홈페이지인 경우 체험단 활성화 (기본)
            if (dataPage === 'experience') {
                link.classList.add('active');
            }
        } else if (linkPath && linkPath.includes(currentPage)) {
            link.classList.add('active');
        } else if (dataPage === currentPage) {
            link.classList.add('active');
        }
    });
}

// 부드러운 스크롤 (앵커 링크)
function smoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header-fixed')?.offsetHeight || 0;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
    smoothScroll();
});

// 뒤로가기/앞으로가기 시 메뉴 업데이트
window.addEventListener('popstate', () => {
    setActiveMenu();
});