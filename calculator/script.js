document.addEventListener('DOMContentLoaded', function() {
    const calculatorForm = document.getElementById('calculatorForm');
    const resultDiv = document.getElementById('result');
    const resultDetails = document.getElementById('resultDetails');
    const totalPrice = document.getElementById('totalPrice');

    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 폼 데이터 수집
        const formData = new FormData(calculatorForm);
        const format = formData.get('format');
        const pages = parseInt(formData.get('pages'));
        const quantity = parseInt(formData.get('quantity'));
        const paper = formData.get('paper');
        const binding = formData.get('binding');
        const finishing = formData.get('finishing');
        const shipping = formData.get('shipping');

        // 새로운 단가 설정
        const paperPrice = getPaperPrice(paper);
        const bindingPrice = getBindingPrice(binding);
        const finishingPrice = getFinishingPrice(finishing);
        const packagingPrice = getPackagingPrice(shipping);

        // 새로운 계산방식 적용
        let total = 0;
        
        // 부수 비용 (부수단가 * 수량) - B5 선택시 50% 할인
        let quantityCost;
        if (format === 'B5') {
            quantityCost = (paperPrice * quantity) * 0.5; // B5 선택시 50% 할인
        } else {
            quantityCost = paperPrice * quantity; // A4는 정가
        }
        total += quantityCost;
        
        // 제본 비용 (제본단가 * 수량)
        const bindingCost = bindingPrice * quantity;
        total += bindingCost;
        
        // 후가공 비용 (후가공단가 * 수량)
        const finishingCost = finishingPrice * quantity;
        total += finishingCost;
        
        // 포장 및 관리비 (배송비 포함일 경우만)
        total += packagingPrice;

        // 결과 표시
        displayResult({
            format,
            pages,
            quantity,
            paper,
            binding,
            finishing,
            shipping,
            paperPrice,
            quantityCost,
            bindingPrice,
            bindingCost,
            finishingPrice,
            finishingCost,
            packagingPrice,
            total
        });
    });

    function getPaperPrice(paper) {
        const paperPrices = {
            '일반용지': 12500,
            '고급용지': 13500
        };
        return paperPrices[paper] || 12500;
    }

    function getBindingPrice(binding) {
        const bindingPrices = {
            '무선제본': 850,
            '양장제본': 1050,
            '댓노리': 850,
            '링제본': 500
        };
        return bindingPrices[binding] || 850;
    }

    function getFinishingPrice(finishing) {
        const finishingPrices = {
            '일반': 2000,
            '고급': 3000
        };
        return finishingPrices[finishing] || 2000;
    }

    function getPackagingPrice(shipping) {
        if (shipping === '포함') {
            return 1300000; // 130만원
        }
        return 0;
    }

    function displayResult(data) {
        // ±10% 범위 계산 (하한가: 90%, 상한가: 110%)
        const lowerBound = Math.round(data.total * 0.9);
        const upperBound = Math.round(data.total * 1.1);
        
        resultDetails.innerHTML = `
            <div><strong>판형:</strong> ${data.format}</div>
            <div><strong>페이지 수:</strong> ${data.pages}페이지</div>
            <div><strong>부수:</strong> ${data.quantity}부</div>
            <div><strong>종이:</strong> ${data.paper}</div>
            <div><strong>제본방식:</strong> ${data.binding}</div>
            <div><strong>후가공:</strong> ${data.finishing}</div>
            <div><strong>배송비:</strong> ${data.shipping}</div>
            <hr>
            <div><strong>부수 비용:</strong> ${data.quantityCost.toLocaleString()}원${data.format === 'B5' ? ' (B5 50% 할인 적용)' : ''}</div>
            <div><strong>제본 비용:</strong> ${data.bindingCost.toLocaleString()}원</div>
            <div><strong>후가공 비용:</strong> ${data.finishingCost.toLocaleString()}원</div>
            <div><strong>포장 및 관리비:</strong> ${data.packagingPrice.toLocaleString()}원</div>
        `;
        
        totalPrice.innerHTML = `<strong> ${lowerBound.toLocaleString()}원 ~ ${upperBound.toLocaleString()}</strong>`;
        resultDiv.style.display = 'block';
        
        // 결과로 스크롤
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }

    // 입력 필드 유효성 검사
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    });

    // 부수 +/- 버튼 기능
    const decreaseBtn = document.getElementById('decreaseQuantity');
    const increaseBtn = document.getElementById('increaseQuantity');
    const quantityInput = document.getElementById('quantity');

    decreaseBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 10) {
            quantityInput.value = currentValue - 10;
        }
    });

    increaseBtn.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        quantityInput.value = currentValue + 10;
    });
});
