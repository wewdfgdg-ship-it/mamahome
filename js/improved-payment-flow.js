/**
 * 개선된 결제 플로우 - 결제 전 주문 생성
 *
 * 장점:
 * 1. 데이터 손실 방지
 * 2. 결제 실패/취소 추적 가능
 * 3. 복잡한 데이터 전달 불필요
 */

// 1단계: 체크아웃에서 주문 생성 (결제 전)
async function createPendingOrder(checkoutData) {
    try {
        // 주문을 pending 상태로 먼저 생성
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: 'ORD-' + Date.now(),
                customer: {
                    name: checkoutData.name,
                    email: checkoutData.email,
                    phone: checkoutData.phone,
                    businessName: checkoutData.businessName,
                    businessNumber: checkoutData.businessNumber
                },
                packageInfo: {
                    name: checkoutData.packageName,
                    price: checkoutData.packagePrice
                },
                amount: checkoutData.packagePrice,
                paymentMethod: 'payapp',
                status: 'pending' // 대기 상태로 생성
            })
        });

        const result = await response.json();

        if (result.success && result.order) {
            // 주문 ID를 PayApp에 전달
            return {
                success: true,
                orderId: result.order.id,
                orderNumber: result.order.order_number
            };
        }

        return { success: false, error: 'Failed to create order' };

    } catch (error) {
        console.error('Order creation failed:', error);
        return { success: false, error: error.message };
    }
}

// 2단계: PayApp 결제 요청 시 주문 ID 포함
function initiatePayment(orderData) {
    const paymentParams = {
        userid: 'mamahome',
        orderNumber: orderData.orderNumber, // DB에 저장된 주문번호
        goodname: orderData.packageName,
        price: orderData.price,
        // 중요: var1에 DB 주문 ID 전달
        var1: orderData.orderId,  // 이 ID로 나중에 업데이트
        returnurl: 'https://mamahome-five.vercel.app/api/payment-redirect'
    };

    // PayApp 호출
    PayApp.setParams(paymentParams);
    PayApp.call();
}

// 3단계: 결제 완료 후 상태만 업데이트
async function updateOrderStatus(orderId, paymentResult) {
    try {
        const response = await fetch(`/api/orders?orderId=${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: paymentResult.state === 'success' ? 'paid' : 'failed',
                paymentResult: paymentResult,
                paidAt: new Date().toISOString()
            })
        });

        const result = await response.json();
        return result.success;

    } catch (error) {
        console.error('Order update failed:', error);
        return false;
    }
}

// 전체 플로우 예시
async function processPaymentFlow(checkoutData) {
    // 1. 주문 생성
    const orderResult = await createPendingOrder(checkoutData);

    if (!orderResult.success) {
        alert('주문 생성 실패. 다시 시도해주세요.');
        return;
    }

    // 2. 세션 스토리지에 주문 ID 저장 (결제 완료 페이지에서 사용)
    sessionStorage.setItem('currentOrderId', orderResult.orderId);

    // 3. PayApp 결제 시작
    initiatePayment({
        orderId: orderResult.orderId,
        orderNumber: orderResult.orderNumber,
        packageName: checkoutData.packageName,
        price: checkoutData.packagePrice
    });
}

// payment-complete.html에서
async function handlePaymentComplete() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentState = urlParams.get('state');
    const var1 = urlParams.get('var1'); // 주문 ID

    if (var1) {
        // 주문 상태 업데이트
        await updateOrderStatus(var1, {
            state: paymentState,
            ...Object.fromEntries(urlParams)
        });
    } else {
        // var1이 없으면 sessionStorage에서 가져오기
        const orderId = sessionStorage.getItem('currentOrderId');
        if (orderId) {
            await updateOrderStatus(orderId, {
                state: paymentState,
                ...Object.fromEntries(urlParams)
            });
        }
    }
}

/**
 * 장점:
 * 1. 결제 전 주문이 이미 DB에 존재 → 데이터 손실 없음
 * 2. 결제 실패/취소도 추적 가능 (pending → failed)
 * 3. 복잡한 데이터 전달 불필요 (ID만 전달)
 * 4. 미완료 주문 추적 가능 (pending 상태 주문들)
 * 5. 재시도 가능 (이미 생성된 주문으로)
 */

// 추가: 미완료 주문 정리 (관리자 기능)
async function cleanupPendingOrders() {
    // 24시간 이상 pending 상태인 주문들을 expired로 변경
    const response = await fetch('/api/orders/cleanup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            olderThan: 24 * 60 * 60 * 1000 // 24시간
        })
    });

    const result = await response.json();
    console.log(`${result.updated} pending orders cleaned up`);
}