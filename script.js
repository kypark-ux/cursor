// 전역 변수
let personnelCount = 0;
let draggedElement = null;

// 상수 정의
const DAILY_RATES = {
    '특급': 406342,
    '고급': 305433,
    '중급': 239748,
    '초급': 215681
};

const ROLES = ['디렉터', 'PM', '기획', '디자인', '영상', '개발'];
const WORKING_DAYS = 21;

// 계산된 등급별 단가 저장
let calculatedRates = {};

// 유틸리티 함수
function getElement(id) {
    return document.getElementById(id);
}

function formatNumber(num) {
    return num.toLocaleString();
}

// 등급별 ID 매핑
function getGradeId(grade) {
    const gradeMap = {
        '특급': 'special',
        '고급': 'senior', 
        '중급': 'middle',
        '초급': 'junior'
    };
    return gradeMap[grade];
}

// 비율 계산 함수
function calculateRates() {
    const overheadRate = parseFloat(getElement('overhead-rate').value) / 100;
    const techRate = parseFloat(getElement('tech-rate').value) / 100;

    Object.keys(DAILY_RATES).forEach(grade => {
        const dailyRate = DAILY_RATES[grade];
        const monthlyRate = Math.round(dailyRate * WORKING_DAYS);
        const overhead = Math.round(monthlyRate * overheadRate);
        const techFee = Math.round((monthlyRate + overhead) * techRate);
        const totalMonthly = monthlyRate + overhead + techFee;

        calculatedRates[grade] = totalMonthly;

        // 테이블 업데이트
        const gradeId = getGradeId(grade);
        getElement(`monthly-${gradeId}`).textContent = formatNumber(monthlyRate);
        getElement(`overhead-${gradeId}`).textContent = formatNumber(overhead);
        getElement(`tech-${gradeId}`).textContent = formatNumber(techFee);
        getElement(`total-${gradeId}`).textContent = formatNumber(totalMonthly);
    });

    calculateTotal();
}

// 인원 추가 함수
function addPersonnel() {
    personnelCount++;
    const container = getElement('personnel-container');
    
    const row = document.createElement('div');
    row.className = 'personnel-row';
    row.id = `personnel-${personnelCount}`;
    row.draggable = true;
    
    // 역할 선택 옵션 생성
    const roleOptions = ROLES.map(role => 
        `<option value="${role}" ${role === '디자인' ? 'selected' : ''}>${role}</option>`
    ).join('');
    
    row.innerHTML = `
        <select onchange="calculateTotal()" class="role-select">
            <option value="">역할 선택</option>
            ${roleOptions}
        </select>
        <select onchange="calculateTotal()" class="grade-select">
            <option value="">등급 선택</option>
            <option value="특급">특급</option>
            <option value="고급">고급</option>
            <option value="중급">중급</option>
            <option value="초급" selected>초급</option>
        </select>
        <input type="number" placeholder="개월수" min="0.1" value="1" step="0.1" onchange="calculateTotal()" oninput="calculateTotal()" class="months-input">
        <div class="row-total" id="row-total-${personnelCount}">0</div>
        <button class="remove-btn" onclick="removePersonnel(${personnelCount})">X</button>
    `;
    
    setupDragAndDrop(row);
    
    container.appendChild(row);
    
    // 초기값 설정 후 계산
    setTimeout(() => {
        calculateTotal();
    }, 50);
}

// 드래그 앤 드롭 설정
function setupDragAndDrop(element) {
    const events = ['dragstart', 'dragend', 'dragover', 'drop', 'dragenter', 'dragleave'];
    const handlers = [handleDragStart, handleDragEnd, handleDragOver, handleDrop, handleDragEnter, handleDragLeave];
    
    events.forEach((event, index) => {
        element.addEventListener(event, handlers[index]);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    if (draggedElement && draggedElement !== this) {
        const container = getElement('personnel-container');
        const allRows = Array.from(container.children);
        const draggedIndex = allRows.indexOf(draggedElement);
        const dropIndex = allRows.indexOf(this);
        
        if (draggedIndex < dropIndex) {
            container.insertBefore(draggedElement, this.nextSibling);
        } else {
            container.insertBefore(draggedElement, this);
        }
        
        calculateTotal();
    }
}

// 단가 업데이트 (현재는 사용되지 않음, 향후 확장을 위해 유지)
function updateUnitPrice(id) {
    // 이 함수는 현재 사용되지 않지만 향후 확장을 위해 유지
    calculateTotal();
}

// 인원 제거
function removePersonnel(id) {
    getElement(`personnel-${id}`).remove();
    calculateTotal();
}

// 총계 계산
function calculateTotal() {
    const discountRate = parseFloat(getElement('discount-rate').value) / 100;
    let subtotal = 0;
    let summaryItems = [];
    
    const rows = document.querySelectorAll('.personnel-row');
    
    rows.forEach(row => {
        const role = row.querySelector('.role-select').value;
        const grade = row.querySelector('.grade-select').value;
        const months = parseFloat(row.querySelector('.months-input').value) || 0;
        
        if (role && grade && months > 0 && calculatedRates[grade]) {
            const unitPrice = calculatedRates[grade];
            const rowTotal = unitPrice * months;
            
            row.querySelector('.row-total').textContent = formatNumber(rowTotal);
            subtotal += rowTotal;
            summaryItems.push(`${role} (${grade} ${months}개월)`);
        } else if (role && grade && months > 0) {
            // 등급은 선택되었지만 아직 단가가 계산되지 않은 경우
            row.querySelector('.row-total').textContent = '계산 중...';
        } else {
            row.querySelector('.row-total').textContent = '0';
        }
    });
    
    // 요약 표시 업데이트
    const summaryElement = getElement('personnel-summary');
    summaryElement.innerHTML = summaryItems.length > 0 
        ? summaryItems.join(' / ') 
        : '인원을 추가해주세요.';
    
    // 할인 계산
    const discountAmount = Math.round(subtotal * discountRate);
    const finalAmount = subtotal - discountAmount;
    
    // UI 업데이트
    getElement('subtotal-amount').textContent = `${formatNumber(subtotal)}원`;
    getElement('discount-amount').textContent = `-${formatNumber(discountAmount)}원`;
    getElement('final-amount').textContent = `${formatNumber(finalAmount)}원`;
    getElement('discount-rate-display').textContent = Math.round(discountRate * 100);
}

// 견적 복사
function copyEstimate() {
    const summary = getElement('personnel-summary').textContent;
    const subtotal = getElement('subtotal-amount').textContent;
    const discount = getElement('discount-amount').textContent;
    const final = getElement('final-amount').textContent;
    const discountRate = getElement('discount-rate').value;
    
    const estimateText = `[견적서]\n\n선택 항목: ${summary}\n\n소계: ${subtotal}\n할인율 (${discountRate}%): ${discount}\n최종 금액: ${final}`;
    
    navigator.clipboard.writeText(estimateText).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '복사 완료!';
        copyBtn.style.backgroundColor = '#1a1a1a';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '#000';
        }, 2000);
    }).catch(err => {
        console.error('클립보드 복사 실패:', err);
        alert('견적 정보 복사에 실패했습니다.');
    });
}

// 초기화
window.onload = function() {
    calculateRates();
    addPersonnel();
};
