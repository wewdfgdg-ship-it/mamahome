// ========== 썸네일 모듈 ========== //

// 전역 변수
let thumbnailsCache = [];
let currentThumbnailId = null;

// 썸네일 목록 로드
async function loadThumbnails(categoryId) {
    const thumbnailsList = document.getElementById('thumbnailsList');
    showLoading('thumbnailsList');

    try {
        const data = await apiCall(`/api/packages?action=thumbnails&category_id=${categoryId}`);

        if (data.success) {
            thumbnailsCache = data.data;
            displayThumbnails(data.data);
        } else {
            showEmptyState('thumbnailsList', '썸네일을 불러오지 못했습니다.');
        }
    } catch (error) {
        console.error('썸네일 로드 오류:', error);
        showEmptyState('thumbnailsList', '오류가 발생했습니다.');
    }
}

// 썸네일 표시
function displayThumbnails(thumbnails) {
    const thumbnailsList = document.getElementById('thumbnailsList');

    if (!thumbnails || thumbnails.length === 0) {
        thumbnailsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>등록된 썸네일이 없습니다.</p>
                <button onclick="showThumbnailModal()" style="margin-top: 10px; padding: 8px 16px; background: #0071e3; color: white; border: none; border-radius: 6px; cursor: pointer;">첫 썸네일 등록</button>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">';

    thumbnails.forEach((thumbnail) => {
        html += `
            <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5; cursor: pointer; transition: all 0.2s;"
                 onclick="selectThumbnail(${thumbnail.id}, '${thumbnail.title.replace(/'/g, "\\'")}')"
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'"
                 onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                ${thumbnail.thumbnail_url ?
                    `<div style="width: 100%; height: 180px; background-image: url('${thumbnail.thumbnail_url}'); background-size: cover; background-position: center;"></div>` :
                    `<div style="width: 100%; height: 180px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>`
                }
                <div style="padding: 15px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 16px;">${thumbnail.title}</h3>
                    ${thumbnail.subtitle ? `<p style="margin: 0 0 5px 0; font-size: 13px; color: #666;">${thumbnail.subtitle}</p>` : ''}
                    ${thumbnail.description ? `<p style="margin: 0; font-size: 12px; color: #999;">${thumbnail.description}</p>` : ''}
                    <div style="display: flex; gap: 5px; margin-top: 10px;">
                        <button onclick="event.stopPropagation(); showThumbnailModal(${thumbnail.id})"
                                style="flex: 1; background: #0071e3; color: white; border: none; padding: 6px; border-radius: 4px; font-size: 12px; cursor: pointer;">수정</button>
                        <button onclick="event.stopPropagation(); deleteThumbnail(${thumbnail.id})"
                                style="flex: 1; background: #ff4444; color: white; border: none; padding: 6px; border-radius: 4px; font-size: 12px; cursor: pointer;">삭제</button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    thumbnailsList.innerHTML = html;
}

// 썸네일 선택
function selectThumbnail(thumbnailId, thumbnailTitle) {
    currentThumbnailId = thumbnailId;

    // 다음 단계로 이동
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.add('active');
    document.getElementById('thumbnailManagement').style.display = 'none';
    document.getElementById('detailManagement').style.display = 'block';

    // 브레드크럼 업데이트
    document.getElementById('selectedThumbnail').textContent = thumbnailTitle;

    // 상세페이지 로드
    loadDetailPage(thumbnailId);
}

// 썸네일 모달 표시
function showThumbnailModal(thumbnailId = null) {
    const modal = document.getElementById('thumbnailModal');
    const form = document.getElementById('thumbnailForm');
    const title = document.getElementById('thumbnailModalTitle');

    if (thumbnailId) {
        // 수정 모드
        title.textContent = '썸네일 수정';
        const thumbnail = thumbnailsCache.find(t => t.id === thumbnailId);
        if (thumbnail) {
            document.getElementById('thumbnailTitle').value = thumbnail.title;
            document.getElementById('thumbnailSubtitle').value = thumbnail.subtitle || '';
            document.getElementById('thumbnailDescription').value = thumbnail.description || '';
            document.getElementById('thumbnailImage').value = thumbnail.thumbnail_url || '';
            document.getElementById('thumbnailTextColor').value = thumbnail.text_color || '#000000';
            document.getElementById('thumbnailTextSize').value = thumbnail.text_size || 'medium';
            document.getElementById('thumbnailActive').checked = thumbnail.is_active;

            // 기존 이미지 미리보기
            if (thumbnail.thumbnail_url) {
                updateThumbnailPreview(thumbnail.thumbnail_url);
            }
        }
        form.onsubmit = (e) => updateThumbnail(e, thumbnailId);
    } else {
        // 등록 모드
        title.textContent = '새 썸네일 등록';
        form.reset();
        document.getElementById('thumbnailActive').checked = true;
        form.onsubmit = (e) => saveThumbnail(e);
    }

    modal.style.display = 'block';
}

// 썸네일 저장
async function saveThumbnail(event) {
    event.preventDefault();

    const thumbnailData = {
        category_id: currentCategoryId,
        title: document.getElementById('thumbnailTitle').value,
        subtitle: document.getElementById('thumbnailSubtitle').value,
        description: document.getElementById('thumbnailDescription').value,
        thumbnail_url: document.getElementById('thumbnailImage').value,
        text_color: document.getElementById('thumbnailTextColor').value,
        text_size: document.getElementById('thumbnailTextSize').value,
        is_active: document.getElementById('thumbnailActive').checked
    };

    try {
        const data = await apiCall('/api/packages?action=thumbnails', {
            method: 'POST',
            body: JSON.stringify(thumbnailData)
        });

        if (data.success) {
            showMessage('썸네일이 등록되었습니다.', 'success');
            closeThumbnailModal();
            loadThumbnails(currentCategoryId);
        } else {
            showMessage(data.error || '썸네일 등록에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('썸네일 저장 오류:', error);
        showMessage('썸네일 저장 중 오류가 발생했습니다.', 'error');
    }
}

// 썸네일 수정
async function updateThumbnail(event, thumbnailId) {
    event.preventDefault();

    const thumbnailData = {
        title: document.getElementById('thumbnailTitle').value,
        subtitle: document.getElementById('thumbnailSubtitle').value,
        description: document.getElementById('thumbnailDescription').value,
        thumbnail_url: document.getElementById('thumbnailImage').value,
        text_color: document.getElementById('thumbnailTextColor').value,
        text_size: document.getElementById('thumbnailTextSize').value,
        is_active: document.getElementById('thumbnailActive').checked
    };

    try {
        const data = await apiCall(`/api/packages?action=thumbnails&id=${thumbnailId}`, {
            method: 'PUT',
            body: JSON.stringify(thumbnailData)
        });

        if (data.success) {
            showMessage('썸네일이 수정되었습니다.', 'success');
            closeThumbnailModal();
            loadThumbnails(currentCategoryId);
        } else {
            showMessage(data.error || '썸네일 수정에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('썸네일 수정 오류:', error);
        showMessage('썸네일 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 썸네일 삭제
async function deleteThumbnail(thumbnailId) {
    if (!confirmAction('이 썸네일을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const data = await apiCall(`/api/packages?action=thumbnails&id=${thumbnailId}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showMessage('썸네일이 삭제되었습니다.', 'success');
            loadThumbnails(currentCategoryId);
        } else {
            showMessage(data.error || '썸네일 삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('썸네일 삭제 오류:', error);
        showMessage('썸네일 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 썸네일 모달 닫기
function closeThumbnailModal() {
    const modal = document.getElementById('thumbnailModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('thumbnailForm').reset();
        document.getElementById('thumbnailPreview').innerHTML = '';
    }
}

// 썸네일 미리보기 업데이트
function updateThumbnailPreview(url) {
    const preview = document.getElementById('thumbnailPreview');
    if (url) {
        preview.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 200px; border-radius: 4px;">`;
    } else {
        preview.innerHTML = '';
    }
}