// ========== 이미지 업로드 모듈 ========== //

// showMessage 함수 정의 (utils.js가 로드되지 않을 경우를 위한 폴백)
if (typeof showMessage === 'undefined') {
    window.showMessage = function(message, type = 'info') {
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
    };
}

// 썸네일 미리보기 업데이트
function updateThumbnailPreview(imageUrl) {
    const previewDiv = document.getElementById('thumbnailPreview');
    if (previewDiv) {
        previewDiv.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    // URL 필드도 업데이트
    const urlInput = document.getElementById('thumbnailImage') || document.getElementById('thumbnailUrl');
    if (urlInput) {
        urlInput.value = imageUrl;
    }
}

// 썸네일 이미지 드롭 처리
function handleThumbnailDrop(event) {
    event.preventDefault();
    event.currentTarget.style.backgroundColor = 'rgb(250, 250, 252)';
    event.currentTarget.style.borderColor = 'rgb(209, 209, 214)';

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        uploadThumbnailImage(files[0]);
    }
}

// 썸네일 파일 선택 처리
function handleThumbnailFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        uploadThumbnailImage(files[0]);
    }
}

// 썸네일 이미지 업로드
async function uploadThumbnailImage(file) {
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
        showMessage('이미지 파일만 업로드 가능합니다.', 'error');
        return;
    }

    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        updateThumbnailPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // FormData 생성
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer admin'
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById('thumbnailImage').value = result.url;
            showMessage('이미지가 업로드되었습니다', 'success');
        } else {
            const error = await response.text();
            showMessage('이미지 업로드 실패: ' + error, 'error');
        }
    } catch (error) {
        console.error('업로드 오류:', error);
        showMessage('이미지 업로드 중 오류 발생', 'error');
    }
}

// 상세 페이지 이미지 드롭 처리
function handleDetailDrop(event) {
    event.preventDefault();
    event.currentTarget.style.backgroundColor = 'rgb(250, 250, 252)';
    event.currentTarget.style.borderColor = 'rgb(209, 209, 214)';

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        // 여러 파일 처리
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                uploadDetailImage(file);
            }
        });
    }
}

// 파일 선택 처리
function handleDetailFileSelect(event) {
    const files = event.target.files;
    Array.from(files).forEach(file => {
        uploadDetailImage(file);
    });
}

// 상세 페이지 이미지 업로드
async function uploadDetailImage(file) {
    // 미리보기 추가
    const reader = new FileReader();
    const imageId = 'detail_' + Date.now() + '_' + Math.random().toString(36).substring(7);

    reader.onload = function(e) {
        const uploadedImages = document.getElementById('detailUploadedImages');
        const imgContainer = document.createElement('div');
        imgContainer.id = imageId;
        imgContainer.style.cssText = 'position: relative; border-radius: 8px; overflow: hidden; background: rgb(250, 250, 252);';

        imgContainer.innerHTML = `
            <img src="${e.target.result}" style="width: 100%; height: 100px; object-fit: cover;">
            <div style="
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
            ">
                <div style="width: 20px; height: 20px; border: 2px solid white; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
            </div>
            <button onclick="removeDetailImage('${imageId}')" style="
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
                display: none;
            ">×</button>
        `;

        uploadedImages.appendChild(imgContainer);
    };

    reader.readAsDataURL(file);

    // FormData 생성 및 업로드
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer admin'
            },
            body: formData
        });

        if (response.ok) {
            const result = await response.json();

            // URL 입력 필드에 추가
            addDetailImageField(result.url);

            // 미리보기 업데이트 (로딩 제거, 삭제 버튼 표시)
            const imgContainer = document.getElementById(imageId);
            if (imgContainer) {
                const overlay = imgContainer.querySelector('div[style*="background: rgba(0, 0, 0, 0.6)"]');
                if (overlay) overlay.remove();
                const deleteBtn = imgContainer.querySelector('button');
                if (deleteBtn) deleteBtn.style.display = 'block';

                // 업로드된 URL 저장
                imgContainer.dataset.url = result.url;
            }

            showMessage('이미지가 업로드되었습니다', 'success');
        } else {
            // 실패 시 미리보기 제거
            const imgContainer = document.getElementById(imageId);
            if (imgContainer) imgContainer.remove();

            const error = await response.text();
            showMessage('이미지 업로드 실패: ' + error, 'error');
        }
    } catch (error) {
        // 오류 시 미리보기 제거
        const imgContainer = document.getElementById(imageId);
        if (imgContainer) imgContainer.remove();

        console.error('업로드 오류:', error);
        showMessage('이미지 업로드 중 오류 발생', 'error');
    }
}

// 상세 페이지 이미지 URL 필드 추가
function addDetailImageField(url = '') {
    const imagesList = document.getElementById('detailImagesList');
    if (!imagesList) {
        console.error('detailImagesList element not found');
        return;
    }

    const imageItem = document.createElement('div');
    imageItem.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px;';
    imageItem.innerHTML = `
        <input type="text" value="${url}" placeholder="이미지 URL" style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid rgb(209, 209, 214);
            border-radius: 6px;
            font-size: 14px;
        ">
        <button type="button" onclick="this.parentElement.remove()" style="
            padding: 8px 16px;
            background: rgb(255, 59, 48);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        ">삭제</button>
    `;
    imagesList.appendChild(imageItem);
}

// 상세 이미지 미리보기 제거
function removeDetailImage(imageId) {
    const imgContainer = document.getElementById(imageId);
    if (imgContainer) {
        // URL 필드에서도 제거
        const url = imgContainer.dataset.url;
        if (url) {
            const inputs = document.querySelectorAll('#detailImagesList input');
            inputs.forEach(input => {
                if (input.value === url) {
                    input.parentElement.remove();
                }
            });
        }
        imgContainer.remove();
    }
}

// 드래그 앤 드롭 이벤트 초기화
function initUploadEvents() {
    // 썸네일 드롭존 클릭 이벤트
    const thumbnailDropZone = document.getElementById('thumbnailDropZone');
    if (thumbnailDropZone) {
        thumbnailDropZone.onclick = function() {
            document.getElementById('thumbnailFileInput').click();
        };
    }

    // 상세페이지 드롭존 클릭 이벤트
    const detailDropZone = document.getElementById('detailDropZone');
    if (detailDropZone) {
        detailDropZone.onclick = function() {
            document.getElementById('detailFileInput').click();
        };
    }

    // CSS 애니메이션 추가
    if (!document.getElementById('uploadAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'uploadAnimationStyle';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }
}

// 전역 함수로 등록 (window 객체에 추가)
window.handleThumbnailDrop = handleThumbnailDrop;
window.handleThumbnailFileSelect = handleThumbnailFileSelect;
window.uploadThumbnailImage = uploadThumbnailImage;
window.updateThumbnailPreview = updateThumbnailPreview;
window.handleDetailDrop = handleDetailDrop;
window.handleDetailFileSelect = handleDetailFileSelect;
window.uploadDetailImage = uploadDetailImage;
window.addDetailImageField = addDetailImageField;
window.removeDetailImage = removeDetailImage;
window.initUploadEvents = initUploadEvents;