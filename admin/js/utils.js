// ========== 전역 변수 ========== //
let authToken = localStorage.getItem('adminToken');

// ========== 유틸리티 함수 ========== //

// 날짜 포맷
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 가격 포맷
function formatPrice(price) {
    if (!price) return '0원';
    return parseInt(price).toLocaleString() + '원';
}

// 메시지 표시
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? 'rgb(255, 59, 48)' : type === 'success' ? 'rgb(52, 199, 89)' : 'rgb(0, 113, 227)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// 로그아웃
function logout() {
    localStorage.removeItem('adminToken');
    location.reload();
}

// 한글을 영문 슬러그로 변환
function generateSlug(korean) {
    const koreanToEnglish = {
        '블로그': 'blog',
        '인스타그램': 'instagram',
        '인스타': 'insta',
        '유튜브': 'youtube',
        '페이스북': 'facebook',
        '틱톡': 'tiktok',
        '트위터': 'twitter',
        '네이버': 'naver',
        '카카오': 'kakao',
        '구글': 'google',
        '리뷰': 'review',
        '댓글': 'comment',
        '좋아요': 'like',
        '팔로우': 'follow',
        '팔로워': 'follower',
        '구독': 'subscribe',
        '구독자': 'subscriber',
        '조회수': 'view',
        '방문': 'visit',
        '체험': 'experience',
        '체험단': 'experience-group',
        '마케팅': 'marketing',
        '홍보': 'promotion',
        '광고': 'ad',
        '이벤트': 'event',
        '캠페인': 'campaign',
        '할인': 'discount',
        '쿠폰': 'coupon',
        '무료': 'free',
        '배송': 'delivery',
        '당근': 'carrot',
        '중고': 'used',
        '새상품': 'new',
        '미개봉': 'unopened'
    };

    // 정확한 매칭 시도
    const lowerKorean = korean.toLowerCase();
    if (koreanToEnglish[lowerKorean]) {
        return koreanToEnglish[lowerKorean];
    }

    // 부분 매칭 시도
    for (const [key, value] of Object.entries(koreanToEnglish)) {
        if (lowerKorean.includes(key)) {
            return value;
        }
    }

    // 매칭 실패 시 한글 발음대로 변환
    const result = korean
        .replace(/[가-각]/g, 'ga')
        .replace(/[나-낙]/g, 'na')
        .replace(/[다-닥]/g, 'da')
        .replace(/[라-락]/g, 'ra')
        .replace(/[마-막]/g, 'ma')
        .replace(/[바-박]/g, 'ba')
        .replace(/[사-삭]/g, 'sa')
        .replace(/[아-악]/g, 'a')
        .replace(/[자-작]/g, 'ja')
        .replace(/[차-착]/g, 'cha')
        .replace(/[카-칵]/g, 'ka')
        .replace(/[타-탁]/g, 'ta')
        .replace(/[파-팍]/g, 'pa')
        .replace(/[하-학]/g, 'ha')
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

    return result || 'untitled';
}

// API 호출 헬퍼
async function apiCall(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    };

    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// 로딩 표시
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">로딩 중...</div>';
    }
}

// 빈 상태 표시
function showEmptyState(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <div>${message}</div>
            </div>
        `;
    }
}

// 확인 다이얼로그
function confirmAction(message) {
    return confirm(message);
}

// DOM 준비 상태 체크
function onReady(callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}