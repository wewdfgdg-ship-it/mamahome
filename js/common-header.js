// 공통 헤더 로드 함수
function loadHeader() {
  // 현재 페이지 경로 확인
  const currentPath = window.location.pathname;
  const isInPagesFolder = currentPath.includes('/pages/');

  // 경로 조정 함수
  const adjustPath = (path) => {
    if (isInPagesFolder) {
      if (path.startsWith('/')) {
        return '..' + path;
      }
      if (path.startsWith('pages/')) {
        return path.replace('pages/', './');
      }
    }
    return path;
  };

  // 현재 페이지 확인 함수
  const isCurrentPage = (href) => {
    const cleanPath = href.replace('../', '/').replace('./', '/pages/');
    return currentPath.includes(cleanPath.split('#')[0]);
  };

  // 헤더 HTML - 상공(SANGGONG) 테마 적용
  const headerHTML = `
    <nav class="unified-header">
      <div class="nav-container">
        <div class="nav-brand">
          <a href="${adjustPath('/index.html')}" class="brand-link">Mrble</a>
        </div>

        <ul class="nav-menu">
          <li class="nav-item">
            <a href="${adjustPath('/index.html')}#about" class="nav-link ${isCurrentPage('/index.html#about') ? 'active' : ''}">미블체험단</a>
          </li>
          <li class="nav-item">
            <a href="${adjustPath('pages/press.html')}" class="nav-link ${isCurrentPage('pages/press.html') ? 'active' : ''}">마케팅정보</a>
          </li>
          <li class="nav-item">
            <a href="${adjustPath('pages/pricing.html')}" class="nav-link ${isCurrentPage('pages/pricing.html') ? 'active' : ''}">마케팅상품</a>
          </li>
          <li class="nav-item">
            <a href="https://www.mrblog.net" class="nav-link" target="_blank">미블홈페이지</a>
          </li>
        </ul>

        <div class="nav-actions">
          <a href="${adjustPath('/login.html')}" class="nav-action-link nav-action-primary" id="login-link">로그인</a>
          <a href="${adjustPath('/dashboard.html')}" class="nav-action-link nav-action-secondary" id="dashboard-link" style="display: none;">마이페이지</a>
          <a href="#" onclick="logout()" class="nav-action-link nav-action-outline" id="logout-link" style="display: none;">로그아웃</a>
        </div>

        <!-- 모바일 메뉴 토글 -->
        <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>

    <!-- 헤더 높이만큼 여백 -->
    <div class="header-spacer"></div>

    <!-- 모바일 메뉴 -->
    <div class="mobile-menu" id="mobileMenu">
      <ul class="mobile-menu-list">
        <li><a href="${adjustPath('/index.html')}#about" class="mobile-menu-link">미블체험단</a></li>
        <li><a href="${adjustPath('pages/press.html')}" class="mobile-menu-link">마케팅정보</a></li>
        <li><a href="${adjustPath('pages/pricing.html')}" class="mobile-menu-link">마케팅상품</a></li>
        <li><a href="https://www.mrblog.net" class="mobile-menu-link" target="_blank">미블홈페이지</a></li>
        <li class="mobile-menu-divider"></li>
        <li><a href="${adjustPath('/login.html')}" class="mobile-menu-link" id="mobile-login">로그인</a></li>
        <li><a href="${adjustPath('/dashboard.html')}" class="mobile-menu-link" id="mobile-dashboard" style="display: none;">마이페이지</a></li>
        <li><a href="#" onclick="logout()" class="mobile-menu-link" id="mobile-logout" style="display: none;">로그아웃</a></li>
      </ul>
    </div>
  `;

  // 헤더 삽입
  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    headerContainer.innerHTML = headerHTML;
  } else {
    // header-container가 없으면 body 최상단에 추가
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
  }

  // 로그인 상태 확인 및 UI 업데이트
  checkAuthStatus();
}

// 모바일 메뉴 토글 함수
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const menuToggle = document.querySelector('.mobile-menu-toggle');

  if (mobileMenu.classList.contains('active')) {
    mobileMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    mobileMenu.classList.add('active');
    menuToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// 로그인 상태 확인 함수
function checkAuthStatus() {
  // 새로운 토큰 시스템 확인 (accessToken)
  const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');

  // 구식 토큰도 함께 확인 (호환성)
  const oldAuthToken = localStorage.getItem('authToken');
  const oldUserToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');

  const isLoggedIn = (accessToken && userInfo) || oldAuthToken || (oldUserToken && userInfo);

  // 데스크톱 메뉴
  const loginLink = document.getElementById('login-link');
  const dashboardLink = document.getElementById('dashboard-link');
  const logoutLink = document.getElementById('logout-link');

  // 모바일 메뉴
  const mobileLogin = document.getElementById('mobile-login');
  const mobileDashboard = document.getElementById('mobile-dashboard');
  const mobileLogout = document.getElementById('mobile-logout');

  if (isLoggedIn) {
    // 로그인 상태
    if (loginLink) loginLink.style.display = 'none';
    if (dashboardLink) dashboardLink.style.display = 'inline-block';
    if (logoutLink) logoutLink.style.display = 'inline-block';

    if (mobileLogin) mobileLogin.style.display = 'none';
    if (mobileDashboard) mobileDashboard.style.display = 'block';
    if (mobileLogout) mobileLogout.style.display = 'block';
  } else {
    // 로그아웃 상태
    if (loginLink) loginLink.style.display = 'inline-block';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutLink) logoutLink.style.display = 'none';

    if (mobileLogin) mobileLogin.style.display = 'block';
    if (mobileDashboard) mobileDashboard.style.display = 'none';
    if (mobileLogout) mobileLogout.style.display = 'none';
  }
}

// 로그아웃 함수
async function logout() {
  // AuthManager가 있으면 사용
  if (typeof AuthManager !== 'undefined') {
    await AuthManager.logout();
  } else {
    // localStorage 및 sessionStorage 정리
    // 새로운 토큰 시스템
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userInfo');

    // 구식 토큰 시스템 (호환성)
    localStorage.removeItem('authToken');
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('userToken');

    // 현재 페이지 경로 확인
    const currentPath = window.location.pathname;
    const isInPagesFolder = currentPath.includes('/pages/');

    // 로그인 페이지로 리다이렉트
    const loginPath = isInPagesFolder ? '../login.html' : '/login.html';
    window.location.href = loginPath;
  }
}

// 페이지 로드 시 헤더 로드
document.addEventListener('DOMContentLoaded', loadHeader);

// 윈도우 리사이즈 시 모바일 메뉴 초기화
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      menuToggle.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});