// ========== 메인 어플리케이션 ========== //

// 초기화 함수
async function initializeApp() {
    // 인증 체크
    if (!authToken) {
        showLoginModal();
        return;
    }

    // 인증 검증
    try {
        const response = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'verify',
                token: authToken
            })
        });

        const data = await response.json();
        if (!data.success) {
            localStorage.removeItem('adminToken');
            showLoginModal();
            return;
        }
    } catch (error) {
        console.error('인증 확인 실패:', error);
        showLoginModal();
        return;
    }

    // 앱 시작
    hideLoginModal();
    initializeNavigation();
    loadInitialData();
    initUploadEvents();
}

// 로그인 모달 표시
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// 로그인 모달 숨기기
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 로그인 처리
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/admin-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'login',
                username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            hideLoginModal();
            initializeNavigation();
            loadInitialData();
            initUploadEvents();
        } else {
            showMessage(data.error || '로그인에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showMessage('로그인 중 오류가 발생했습니다.', 'error');
    }
}

// 네비게이션 초기화
function initializeNavigation() {
    // 현재 페이지에 따라 활성 메뉴 설정
    const currentPage = window.location.pathname.includes('packages') ? 'packages' : 'dashboard';

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.includes('패키지 관리') && currentPage === 'packages') {
            link.classList.add('active');
        } else if (link.textContent.includes('대시보드') && currentPage === 'dashboard') {
            link.classList.add('active');
        }
    });
}

// 초기 데이터 로드
function loadInitialData() {
    const currentStep = getCurrentStep();

    switch(currentStep) {
        case 1:
            loadCategories();
            break;
        case 2:
            if (currentCategoryId) {
                loadThumbnails(currentCategoryId);
            }
            break;
        case 3:
            if (currentThumbnailId) {
                loadDetailPage(currentThumbnailId);
            }
            break;
        case 4:
            if (currentCategoryId) {
                loadPrices(currentCategoryId);
            }
            break;
    }
}

// 현재 단계 확인
function getCurrentStep() {
    const activeStep = document.querySelector('.step.active');
    if (activeStep) {
        return parseInt(activeStep.dataset.step) || 1;
    }
    return 1;
}

// 단계 이동
function goToStep(step) {
    // 모든 단계 비활성화
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('[id$="Management"]').forEach(m => m.style.display = 'none');

    // 선택한 단계 활성화
    document.querySelector(`#step${step}`).classList.add('active');

    switch(step) {
        case 1:
            document.getElementById('categoryManagement').style.display = 'block';
            document.getElementById('breadcrumb').style.display = 'none';
            loadCategories();
            break;
        case 2:
            if (currentCategoryId) {
                document.getElementById('thumbnailManagement').style.display = 'block';
                document.getElementById('breadcrumb').style.display = 'block';
                loadThumbnails(currentCategoryId);
            } else {
                goToStep(1);
            }
            break;
        case 3:
            if (currentThumbnailId) {
                document.getElementById('detailManagement').style.display = 'block';
                loadDetailPage(currentThumbnailId);
            } else {
                goToStep(2);
            }
            break;
        case 4:
            if (currentCategoryId) {
                document.getElementById('priceManagement').style.display = 'block';
                loadPrices(currentCategoryId);
            } else {
                goToStep(1);
            }
            break;
    }
}

// 상세페이지 관련 함수들 (details.js로 이동 예정)
let currentDetailPageId = null;

async function loadDetailPage(thumbnailId) {
    try {
        const response = await fetch(`/api/packages?action=detail-pages&thumbnail_id=${thumbnailId}`);
        const data = await response.json();

        if (data.success && data.data) {
            currentDetailPageId = data.data.id;

            // 이미지 목록 표시
            const imagesList = document.getElementById('detailImagesList');
            const uploadedImages = document.getElementById('detailUploadedImages');
            imagesList.innerHTML = '';
            uploadedImages.innerHTML = '';

            if (data.data.content_images && Array.isArray(data.data.content_images)) {
                data.data.content_images.forEach((url, index) => {
                    addDetailImageField(url);
                    // 기존 이미지 미리보기도 표시
                    if (url) {
                        const imgId = 'existing_' + Date.now() + '_' + Math.random().toString(36).substring(7);
                        const imgContainer = document.createElement('div');
                        imgContainer.id = imgId;
                        imgContainer.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: rgb(250, 250, 252);';
                        imgContainer.dataset.url = url;

                        imgContainer.innerHTML = `
                            <img src="${url}" style="width: 100%; height: 100px; object-fit: cover;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 100 100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23f5f5f7\\'/%3E%3Ctext x=\\'50\\' y=\\'50\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%238e8e93\\' font-size=\\'12\\'%3E이미지 없음%3C/text%3E%3C/svg%3E'">
                            <button onclick="removeDetailImage('${imgId}')" style="
                                position: absolute;
                                top: 4px;
                                right: 4px;
                                background: rgba(255, 59, 48, 0.9);
                                color: white;
                                border: none;
                                border-radius: 50%;
                                width: 20px;
                                height: 20px;
                                font-size: 12px;
                                cursor: pointer;
                            ">×</button>
                        `;

                        uploadedImages.appendChild(imgContainer);
                    }
                });
            }

            // HTML 콘텐츠
            document.getElementById('detailContent').value = data.data.content_html || '';

            // 스타일
            if (data.data.text_styles) {
                document.getElementById('textColor').value = data.data.text_styles.color || '#333333';
                document.getElementById('textSize').value = data.data.text_styles.size || '16px';
            }

            // 미리보기 업데이트
            updateDetailPreview();
        } else {
            // 새 상세페이지 생성
            currentDetailPageId = null;
            document.getElementById('detailImagesList').innerHTML = '';
            document.getElementById('detailUploadedImages').innerHTML = '';
            document.getElementById('detailContent').value = '';
            document.getElementById('textColor').value = '#333333';
            document.getElementById('textSize').value = '16px';
        }
    } catch (error) {
        console.error('상세페이지 로드 오류:', error);
    }
}

// 상세 이미지 필드 추가
function addDetailImage() {
    // upload.js의 함수를 사용
    if (typeof window.addDetailImageField === 'function') {
        window.addDetailImageField('');
    } else {
        console.error('addDetailImageField 함수를 찾을 수 없습니다');
    }
}

// 미리보기 업데이트
function updateDetailPreview() {
    const preview = document.getElementById('detailPreview');
    const content = document.getElementById('detailContent').value;
    const color = document.getElementById('textColor').value;
    const size = document.getElementById('textSize').value;

    // 이미지들
    const imageInputs = document.querySelectorAll('#detailImagesList input');
    let imagesHtml = '';
    imageInputs.forEach(input => {
        if (input.value) {
            imagesHtml += `<img src="${input.value}" style="width: 100%; margin-bottom: 20px; border-radius: 8px;">`;
        }
    });

    preview.innerHTML = `
        ${imagesHtml}
        <div style="color: ${color}; font-size: ${size};">
            ${content}
        </div>
    `;
}

// 가격 관련 함수들 (prices.js로 이동 예정)
async function loadPrices(categoryId) {
    const pricesList = document.getElementById('pricesList');
    pricesList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">가격을 불러오는 중...</td></tr>';

    try {
        const response = await fetch(`/api/packages?action=prices&category_id=${categoryId}`);
        const data = await response.json();

        if (data.success) {
            displayPrices(data.data);
        } else {
            pricesList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">가격을 불러오지 못했습니다.</td></tr>';
        }
    } catch (error) {
        console.error('가격 로드 오류:', error);
        pricesList.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">오류가 발생했습니다.</td></tr>';
    }
}

function displayPrices(prices) {
    const pricesList = document.getElementById('pricesList');

    if (!prices || prices.length === 0) {
        pricesList.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    등록된 가격이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    prices.forEach(price => {
        html += `
            <tr>
                <td>${price.option_name}</td>
                <td>${formatPrice(price.original_price)}</td>
                <td>${formatPrice(price.discounted_price)}</td>
                <td>${price.discount_rate}%</td>
                <td>
                    <span class="status-badge ${price.is_active ? 'status-paid' : 'status-cancelled'}">
                        ${price.is_active ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="editPrice(${price.id})">수정</button>
                        <button class="action-btn delete" onclick="deletePrice(${price.id})">삭제</button>
                    </div>
                </td>
            </tr>
        `;
    });
    pricesList.innerHTML = html;
}

// DOM 준비 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp);