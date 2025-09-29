// ========== 카테고리 모듈 ========== //

// 전역 변수
let categoriesCache = [];
let currentCategoryId = null;

// 카테고리 목록 로드
async function loadCategories() {
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">카테고리를 불러오는 중...</div>';

    try {
        const data = await apiCall('/api/packages?action=categories');

        if (data.success) {
            categoriesCache = data.data;
            displayCategories(data.data);
        } else {
            categoriesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">카테고리를 불러오지 못했습니다.</div>';
        }
    } catch (error) {
        console.error('카테고리 로드 오류:', error);
        categoriesList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">오류가 발생했습니다.</div>';
    }
}

// 카테고리 표시
function displayCategories(categories) {
    const categoriesList = document.getElementById('categoriesList');

    if (!categories || categories.length === 0) {
        categoriesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <p>등록된 카테고리가 없습니다.</p>
                <button onclick="showCategoryModal()" style="margin-top: 10px; padding: 8px 16px; background: #0071e3; color: white; border: none; border-radius: 6px; cursor: pointer;">첫 카테고리 등록</button>
            </div>
        `;
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';

    categories.forEach((category) => {
        const categoryCard = document.createElement('div');
        categoryCard.style.cssText = `
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ddd;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
        `;

        // 호버 효과
        categoryCard.onmouseover = () => {
            categoryCard.style.transform = 'translateY(-2px)';
            categoryCard.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        };
        categoryCard.onmouseout = () => {
            categoryCard.style.transform = 'none';
            categoryCard.style.boxShadow = 'none';
        };

        categoryCard.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${category.name}</div>
            <div style="font-size: 12px; color: #666;">slug: ${category.slug}</div>
            <div style="font-size: 13px; color: #999; margin-top: 5px;">${category.display_order}순위</div>
            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 5px;">
                <button onclick="event.stopPropagation(); editCategory(${category.id})"
                        style="background: #0071e3; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">수정</button>
                <button onclick="event.stopPropagation(); deleteCategory(${category.id})"
                        style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">삭제</button>
            </div>
        `;

        // 카테고리 선택 이벤트
        categoryCard.onclick = () => selectCategory(category.id, category.name);

        categoriesList.appendChild(categoryCard);
    });
}

// 카테고리 선택
function selectCategory(categoryId, categoryName) {
    currentCategoryId = categoryId;

    // 다음 단계로 이동
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    document.getElementById('categoryManagement').style.display = 'none';
    document.getElementById('thumbnailManagement').style.display = 'block';

    // 브레드크럼 업데이트
    document.getElementById('breadcrumb').style.display = 'block';
    document.getElementById('selectedCategory').textContent = categoryName;

    // 썸네일 목록 로드
    loadThumbnails(categoryId);
}

// 카테고리 모달 표시
function showCategoryModal(categoryId = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const title = document.getElementById('categoryModalTitle');

    if (!modal) {
        console.error('카테고리 모달을 찾을 수 없습니다');
        return;
    }

    if (categoryId) {
        // 수정 모드
        title.textContent = '카테고리 수정';
        const category = categoriesCache.find(c => c.id === categoryId);

        if (category) {
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categorySlug').value = category.slug;
            document.getElementById('categoryOrder').value = category.display_order;
            document.getElementById('categoryActive').checked = category.is_active;
        }

        form.onsubmit = (e) => updateCategory(e, categoryId);
    } else {
        // 등록 모드
        title.textContent = '새 카테고리 등록';
        form.reset();
        document.getElementById('categoryActive').checked = true;
        form.onsubmit = (e) => saveCategory(e);
    }

    modal.style.display = 'block';
}

// 카테고리 저장
async function saveCategory(event) {
    event.preventDefault();

    const categoryData = {
        name: document.getElementById('categoryName').value,
        slug: document.getElementById('categorySlug').value || generateSlug(document.getElementById('categoryName').value),
        display_order: parseInt(document.getElementById('categoryOrder').value) || 1,
        is_active: document.getElementById('categoryActive').checked
    };

    try {
        const data = await apiCall('/api/packages?action=categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });

        if (data.success) {
            showMessage('카테고리가 등록되었습니다.', 'success');
            closeCategoryModal();
            loadCategories();
        } else {
            showMessage(data.error || '카테고리 등록에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('카테고리 저장 오류:', error);
        showMessage('카테고리 저장 중 오류가 발생했습니다.', 'error');
    }
}

// 카테고리 수정
async function updateCategory(event, categoryId) {
    event.preventDefault();

    const categoryData = {
        name: document.getElementById('categoryName').value,
        slug: document.getElementById('categorySlug').value,
        display_order: parseInt(document.getElementById('categoryOrder').value) || 1,
        is_active: document.getElementById('categoryActive').checked
    };

    try {
        const data = await apiCall(`/api/packages?action=categories&id=${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });

        if (data.success) {
            showMessage('카테고리가 수정되었습니다.', 'success');
            closeCategoryModal();
            loadCategories();
        } else {
            showMessage(data.error || '카테고리 수정에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('카테고리 수정 오류:', error);
        showMessage('카테고리 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 카테고리 편집
function editCategory(categoryId) {
    showCategoryModal(categoryId);
}

// 카테고리 삭제
async function deleteCategory(categoryId) {
    if (!confirmAction('이 카테고리를 삭제하시겠습니까? 하위 썸네일과 가격도 모두 삭제됩니다.')) {
        return;
    }

    try {
        const data = await apiCall(`/api/packages?action=categories&id=${categoryId}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showMessage('카테고리가 삭제되었습니다.', 'success');
            loadCategories();
        } else {
            showMessage(data.error || '카테고리 삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('카테고리 삭제 오류:', error);
        showMessage('카테고리 삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 카테고리 모달 닫기
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('categoryForm').reset();
    }
}

// 슬러그 자동 생성 이벤트
document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById('categoryName');
    const slugInput = document.getElementById('categorySlug');

    if (nameInput && slugInput) {
        nameInput.addEventListener('input', function() {
            if (!slugInput.value || slugInput.value === generateSlug(this.dataset.previousValue || '')) {
                slugInput.value = generateSlug(this.value);
            }
            this.dataset.previousValue = this.value;
        });
    }
});