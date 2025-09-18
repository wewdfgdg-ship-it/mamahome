// 인증 관련 공통 함수
// 모든 페이지에서 사용할 수 있는 인증 헬퍼 함수들

const AuthManager = {
  // API 기본 URL 설정
  getApiUrl() {
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://mamahome-five.vercel.app/api';
    } else if (window.location.hostname.includes('github.io')) {
      return 'https://mamahome-five.vercel.app/api'; // GitHub Pages도 Vercel API 사용
    } else {
      return '/api'; // 로컬 환경
    }
  },

  // 액세스 토큰 가져오기
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },

  // 리프레시 토큰 가져오기
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },

  // 사용자 정보 가져오기
  getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  // 로그인 상태 확인
  isLoggedIn() {
    return !!this.getAccessToken() && !!this.getUserInfo();
  },

  // 회원가입
  async register(userData) {
    try {
      const response = await fetch(`${this.getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 토큰 및 사용자 정보 저장
        this.saveAuthData(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.error || '회원가입에 실패했습니다.' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  },

  // 로그인
  async login(email, password, rememberMe = false) {
    try {
      const response = await fetch(`${this.getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 토큰 및 사용자 정보 저장
        this.saveAuthData(data, rememberMe);
        return { success: true, data };
      } else {
        return { success: false, error: data.error || '로그인에 실패했습니다.' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  },

  // 로그아웃
  async logout() {
    const refreshToken = this.getRefreshToken();

    // 서버에 로그아웃 요청
    try {
      await fetch(`${this.getApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // 로컬 스토리지 정리
    this.clearAuthData();

    // 홈페이지로 리다이렉트
    window.location.href = '/';
  },

  // 토큰 검증
  async verifyToken() {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${this.getApiUrl()}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return response.ok && data.valid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  // 토큰 갱신
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.getApiUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  },

  // 현재 사용자 정보 가져오기 (서버에서)
  async getCurrentUser() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch(`${this.getApiUrl()}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        // 토큰 만료 시 갱신 시도
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // 재시도
          return await this.getCurrentUser();
        } else {
          this.clearAuthData();
          return null;
        }
      }

      const data = await response.json();
      if (response.ok && data.success) {
        // 로컬 스토리지 업데이트
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // 사용자 정보 업데이트
  async updateUser(userId, userData) {
    const token = this.getAccessToken();
    if (!token) return { success: false, error: '인증이 필요합니다.' };

    try {
      const response = await fetch(`${this.getApiUrl()}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 로컬 스토리지 업데이트
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        return { success: true, data };
      } else {
        return { success: false, error: data.error || '정보 수정에 실패했습니다.' };
      }
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  },

  // 사용자 주문 내역 가져오기
  async getUserOrders(userId) {
    const token = this.getAccessToken();
    if (!token) return { success: false, error: '인증이 필요합니다.' };

    try {
      const response = await fetch(`${this.getApiUrl()}/users/${userId}/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, orders: data.orders };
      } else {
        return { success: false, error: data.error || '주문 조회에 실패했습니다.' };
      }
    } catch (error) {
      console.error('Get user orders error:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다.' };
    }
  },

  // 인증 데이터 저장
  saveAuthData(data, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem('accessToken', data.accessToken);
    storage.setItem('refreshToken', data.refreshToken);
    storage.setItem('userInfo', JSON.stringify(data.user));

    // rememberMe가 false인 경우에도 localStorage에서 제거
    if (!rememberMe) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
    }
  },

  // 인증 데이터 삭제
  clearAuthData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('userInfo');
  },

  // 인증이 필요한 페이지 보호
  requireAuth(redirectUrl = '/login.html') {
    if (!this.isLoggedIn()) {
      // 로그인 페이지로 리다이렉트
      window.location.href = redirectUrl + '?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  },

  // 이미 로그인된 경우 리다이렉트
  redirectIfLoggedIn(redirectUrl = '/dashboard.html') {
    if (this.isLoggedIn()) {
      window.location.href = redirectUrl;
      return true;
    }
    return false;
  },

  // Authorization 헤더 생성
  getAuthHeader() {
    const token = this.getAccessToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  },

  // API 요청 헬퍼 (인증 포함)
  async apiRequest(url, options = {}) {
    const token = this.getAccessToken();

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...(options.headers || {})
      }
    };

    const response = await fetch(`${this.getApiUrl()}${url}`, {
      ...defaultOptions,
      ...options
    });

    // 401 에러 시 토큰 갱신 시도
    if (response.status === 401 && token) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // 새 토큰으로 재시도
        return await this.apiRequest(url, options);
      } else {
        // 갱신 실패 시 로그아웃
        this.clearAuthData();
        window.location.href = '/login.html';
        throw new Error('Authentication failed');
      }
    }

    return response;
  }
};

// 전역 객체로 내보내기
window.AuthManager = AuthManager;