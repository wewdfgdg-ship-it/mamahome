// 페이앱 결제 처리 모듈
// REST API 방식 구현

function PayappPayment(config) {
    this.config = config;
    this.apiUrl = 'https://api.payapp.kr/oapi/apiLoad.html';
    
    // 결제 요청
    this.requestPayment = function(params, callback) {
        // console.log('페이앱 REST API 결제 요청 시작');
        // console.log('받은 파라미터:', params);
        
        // 필수 파라미터 검증
        if (!params.goodname || !params.price || !params.recvphone) {
            console.error('필수 파라미터 누락:', {
                goodname: params.goodname || '매장명 미입력',
                price: params.price,
                recvphone: params.recvphone
            });
            callback({
                state: 'ERROR',
                message: '필수 파라미터가 누락되었습니다.'
            });
            return;
        }
        
        // API 요청 파라미터 구성
        const apiParams = {
            cmd: 'payrequest',
            userid: this.config.userid,
            linkkey: this.config.linkkey,
            goodname: params.goodname || '매장명 미입력',
            price: params.price.toString(),
            recvphone: params.recvphone.replace(/-/g, ''),
            memo: params.memo || '',
            reqaddr: '0',
            feedbackurl: this.config.feedbackurl,
            var1: params.var1 || '',
            var2: params.var2 || '',
            smsuse: params.smsuse || 'n',
            email: params.email || '',
            buyer: params.buyer || ''
        };
        
        // console.log('API 파라미터:', apiParams);
        
        // linkkey가 없으면 오류
        if (!this.config.linkkey) {
            console.error('페이앱 연동키가 없습니다');
            alert('페이앱 연동키가 설정되지 않았습니다.');
            return;
        }
        
        // 개발 모드에서만 테스트 결제 처리
        if (this.config.environment === 'development') {
            // console.log('🔧 개발/테스트 모드 결제');
            
            // 테스트 결제 확인 다이얼로그
            const confirmMessage = `[테스트 결제]\n\n` +
                `상품명: ${params.goodname}\n` +
                `금액: ${parseInt(params.price).toLocaleString()}원\n` +
                `구매자: ${params.buyer}\n` +
                `연락처: ${params.recvphone}\n\n` +
                `테스트 결제를 진행하시겠습니까?`;
            
            if (confirm(confirmMessage)) {
                // 테스트 결제 성공
                setTimeout(() => {
                    console.log('✅ 테스트 결제 완료');
                    callback({
                        state: 'SUCCESS',
                        message: '테스트 결제가 완료되었습니다.',
                        orderid: 'TEST_' + Date.now()
                    });
                }, 1000);
            } else {
                // 테스트 결제 취소
                callback({
                    state: 'CANCEL',
                    message: '사용자가 결제를 취소했습니다.'
                });
            }
            return;
        }
        
        // 실제 페이앱 결제 (운영 모드)
        // console.log('📡 실제 페이앱 결제 진행');
        
        // POST 방식으로 페이앱 API 호출하여 결제 URL 받기
        const paymentMethod = 'direct';  // 'direct' 방식으로 바로 결제창 열기
        
        if (paymentMethod === 'direct') {
            // 프록시 서버를 통해 payurl 받아서 새창 열기
            // console.log('페이앱 API 호출하여 payurl 받기');
            
            // FormData 생성
            const formData = new FormData();
            formData.append('cmd', 'payrequest');
            formData.append('userid', this.config.userid);
            formData.append('linkkey', this.config.linkkey);
            formData.append('goodname', params.goodname);
            formData.append('price', params.price.toString());
            formData.append('recvphone', params.recvphone.replace(/-/g, ''));
            formData.append('buyer', params.buyer || '');
            formData.append('email', params.email || '');
            formData.append('memo', params.memo || '');
            // feedbackurl이 있을 때만 추가 (없으면 에러 70080 방지)
            if (this.config.feedbackurl) {
                formData.append('feedbackurl', this.config.feedbackurl);
            }
            // 로컬 테스트 환경을 위한 동적 URL 생성
            let returnUrl = this.config.returnurl;
            if (!returnUrl && window.location.protocol !== 'file:') {
                // http:// 또는 https:// 프로토콜의 경우만 returnurl 설정
                returnUrl = window.location.origin + '/pages/payment-complete.html';
            }
            // file:// 프로토콜이면 returnurl을 설정하지 않음 (페이앱 기본 페이지 사용)
            if (returnUrl) {
                formData.append('returnurl', returnUrl);
            }
            formData.append('var1', params.var1 || '');
            formData.append('var2', params.var2 || '');
            formData.append('reqaddr', '0');
            formData.append('smsuse', 'n');
            
            // 결제 수단에 따른 openpaytype 설정
            let payType = 'card';
            if (params.paymentMethod) {
                const methodMap = {
                    '신용카드': 'card',
                    '계좌이체': 'rbank',
                    '카카오페이': 'kakaopay',
                    '네이버페이': 'naverpay',
                    '토스페이': 'tosspay'
                };
                payType = methodMap[params.paymentMethod] || 'card';
            }
            formData.append('openpaytype', payType);
            
            // 프록시 서버로 요청 (Vercel Function)
            fetch('/api/payapp-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(response => {
                // console.log('프록시 응답 상태:', response.status);
                // console.log('프록시 응답 헤더:', response.headers);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 응답이 텍스트인지 JSON인지 확인
                return response.text();
            })
            .then(responseText => {
                // console.log('페이앱 API 응답 원본:', responseText);

                // URL 인코딩된 응답 파싱
                let data = {};
                if (responseText.includes('=')) {
                    // URL 파라미터 형식 파싱
                    const params = new URLSearchParams(responseText);
                    data = Object.fromEntries(params);
                    // console.log('파싱된 페이앱 응답:', data);
                } else {
                    // JSON 형식 시도
                    try {
                        data = JSON.parse(responseText);
                    } catch (e) {
                        console.error('응답 파싱 실패:', e);
                        data = { state: 0, errorMessage: '응답 파싱 실패' };
                    }
                }
                
                if (data.state === '1' && data.payurl) {
                    // payurl 디코딩 (이미 프록시에서 처리됨)
                    const payUrl = data.payurl;
                    // console.log('결제 URL:', payUrl);
                    
                    // 현재 창에서 결제 페이지로 이동
                    // console.log('현재 창에서 결제 페이지로 이동합니다.');

                    callback({
                        state: 'PROCESSING',
                        message: '페이앱 결제 페이지로 이동합니다.\n결제를 진행해주세요.'
                    });

                    // 현재 창에서 결제 URL로 이동
                    setTimeout(() => {
                        window.location.href = payUrl;
                    }, 500);
                } else {
                    // API 오류
                    console.error('PayApp API 오류:', data);
                    alert('결제 요청 실패: ' + (data.errorMessage || '알 수 없는 오류'));
                    callback({
                        state: 'ERROR',
                        message: data.errorMessage || '결제 요청 실패'
                    });
                }
            })
            .catch(error => {
                console.error('프록시 서버 호출 오류:', error);
                console.error('에러 상세:', error.message);
                console.error('에러 스택:', error.stack);

                // 네트워크 에러인지 확인
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    alert('네트워크 연결 오류가 발생했습니다.\n인터넷 연결을 확인해주세요.');
                } else {
                    alert('결제 시스템 연결에 실패했습니다.\n잠시 후 다시 시도해주세요.');
                }

                callback({
                    state: 'ERROR',
                    message: '결제 시스템 연결 실패: ' + error.message
                });
            });
            
        } else if (paymentMethod === 'api') {
            // 페이앱 API에 POST 요청
            const apiUrl = 'https://api.payapp.kr/oapi/apiLoad.html';
            
            // FormData 생성 (POST 전송용)
            const formData = new FormData();
            formData.append('cmd', 'payrequest');
            formData.append('userid', this.config.userid);
            formData.append('linkkey', this.config.linkkey);
            formData.append('goodname', params.goodname);
            formData.append('price', params.price.toString());
            formData.append('recvphone', params.recvphone.replace(/-/g, ''));
            formData.append('buyer', params.buyer || '');
            formData.append('email', params.email || '');
            formData.append('memo', params.memo || '');
            formData.append('reqaddr', '0');
            // feedbackurl이 있을 때만 추가
            if (this.config.feedbackurl) {
                formData.append('feedbackurl', this.config.feedbackurl);
            }
            formData.append('var1', params.var1 || '');
            formData.append('var2', params.var2 || '');
            formData.append('smsuse', 'n');  // SMS 사용 안함
            formData.append('redirectpay', '1');  // 즉시 결제 페이지로 리다이렉트
            // 결제 수단에 따른 openpaytype 설정
            let payType = 'card';  // 기본값
            if (params.paymentMethod) {
                const methodMap = {
                    '신용카드': 'card',
                    '계좌이체': 'rbank',
                    '카카오페이': 'kakaopay',
                    '네이버페이': 'naverpay',
                    '토스페이': 'tosspay'
                };
                payType = methodMap[params.paymentMethod] || 'card';
            }
            formData.append('openpaytype', payType);  // 선택된 결제 수단
            formData.append('shopname', 'Meble');  // 상점명
            
            // console.log('페이앱 API POST 요청 시작');
            
            // CORS 문제로 인해 서버 프록시 사용 (Vercel Function)
            fetch('/api/payapp-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            })
            .then(response => {
                // console.log('프록시 응답 상태:', response.status);
                // console.log('프록시 응답 헤더:', response.headers);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // 응답이 텍스트인지 JSON인지 확인
                return response.text();
            })
            .then(responseText => {
                // console.log('페이앱 API 응답 원본:', responseText);

                // URL 인코딩된 응답 파싱
                let data = {};
                if (responseText.includes('=')) {
                    // URL 파라미터 형식 파싱
                    const params = new URLSearchParams(responseText);
                    data = Object.fromEntries(params);
                    // console.log('파싱된 페이앱 응답:', data);
                } else {
                    // JSON 형식 시도
                    try {
                        data = JSON.parse(responseText);
                    } catch (e) {
                        console.error('응답 파싱 실패:', e);
                        data = { state: 0, errorMessage: '응답 파싱 실패' };
                    }
                }
                
                if (data.state === '1' && data.payurl) {
                    // 결제 URL 받기 성공 - 현재 창에서 이동
                    // console.log('현재 창에서 결제 페이지로 이동합니다.');

                    callback({
                        state: 'PROCESSING',
                        message: '페이앱 결제 페이지로 이동합니다.\n결제를 진행해주세요.'
                    });

                    // 현재 창에서 결제 URL로 이동
                    setTimeout(() => {
                        window.location.href = data.payurl;
                    }, 500);
                } else if (false) {
                    // 이 코드는 실행되지 않음 (팝업 차단 관련 코드 제거)
                    callback({
                        state: 'ERROR',
                            message: '팝업이 차단되었습니다.'
                        });
                    }
                } else {
                    // API 오류
                    callback({
                        state: 'ERROR',
                        message: data.errorMessage || '결제 요청 실패'
                    });
                }
            })
            .catch(error => {
                console.error('페이앱 API 호출 오류:', error);
                
                // 프록시 서버가 없는 경우 직접 페이앱 페이지로 이동
                // console.log('프록시 서버 연결 실패, 직접 결제 페이지로 이동 시도');
                
                // 폼 생성하여 POST 전송  
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://api.payapp.kr/oapi/apiLoad.html';  // 페이앱 API 엔드포인트
                form.target = 'payapp_window';  // 새창 이름 지정
                form.style.display = 'none';
                
                // 필수 파라미터 추가
                const fields = {
                    cmd: 'payrequest',
                    userid: this.config.userid,
                    linkkey: this.config.linkkey,
                    goodname: params.goodname || '매장명 미입력',
                    price: params.price.toString(),
                    recvphone: params.recvphone.replace(/-/g, ''),
                    buyer: params.buyer || '',
                    email: params.email || '',
                    memo: params.memo || '',
                    // feedbackurl은 있을 때만 추가
                    returnurl: (() => {
                        if (this.config.returnurl) return this.config.returnurl;
                        if (window.location.protocol === 'file:') {
                            const currentPath = window.location.pathname;
                            const baseDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
                            return 'file://' + baseDir + '/payment-complete.html';
                        }
                        return window.location.origin + '/pages/payment-complete.html';
                    })(),
                    var1: params.var1 || '',
                    var2: params.var2 || '',
                    openpaytype: params.paymentMethod === '계좌이체' ? 'rbank' : 
                                params.paymentMethod === '카카오페이' ? 'kakaopay' :
                                params.paymentMethod === '네이버페이' ? 'naverpay' :
                                params.paymentMethod === '토스페이' ? 'tosspay' : 'card',  // 결제 수단
                    redirectpay: '1',  // 즉시 결제 페이지로 이동
                    shopname: 'Meble'  // 상점명
                };
                
                // feedbackurl이 있으면 추가
                if (this.config.feedbackurl) {
                    fields.feedbackurl = this.config.feedbackurl;
                }
                
                for (const [key, value] of Object.entries(fields)) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                }
                
                // 먼저 새창 열기
                const payWindow = window.open('', 'payapp_window', 'width=720,height=800,scrollbars=yes,resizable=yes');
                
                if (payWindow) {
                    // 폼을 body에 추가하고 제출
                    document.body.appendChild(form);
                    form.submit();
                    
                    // 폼 제거
                    setTimeout(() => {
                        document.body.removeChild(form);
                    }, 100);
                    
                    // 결제창 모니터링
                    const checkInterval = setInterval(() => {
                        if (payWindow.closed) {
                            clearInterval(checkInterval);
                            callback({
                                state: 'PROCESSING',
                                message: '결제창이 닫혔습니다.'
                            });
                        }
                    }, 1000);
                    
                    callback({
                        state: 'PROCESSING',
                        message: '페이앱 결제 페이지가 열렸습니다.\n카드 결제를 진행해주세요.'
                    });
                } else {
                    alert('팝업이 차단되었습니다.\n팝업을 허용한 후 다시 시도해주세요.');
                    callback({
                        state: 'ERROR',
                        message: '팝업이 차단되었습니다.'
                    });
                }
            })
            
        } else {
            // 방법 2: 백엔드 API를 통한 결제 요청 (SMS 전송)
            fetch('/api/payment-request.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    goodname: params.goodname || '매장명 미입력',
                    price: params.price,
                    recvphone: params.recvphone,
                    buyer: params.buyer,
                    email: params.email,
                    memo: params.memo,
                    var1: params.var1,
                    var2: params.var2
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    callback({
                        state: 'SUCCESS',
                        message: data.message,
                        orderid: data.orderid
                    });
                } else {
                    callback({
                        state: 'ERROR',
                        message: data.message
                    });
                }
            })
            .catch(error => {
                console.error('API 호출 오류:', error);
                callback({
                    state: 'ERROR',
                    message: '결제 요청 중 오류가 발생했습니다.'
                });
            });
        }
    };
    
    // 결제창 열기 (PayappLite 호환)
    this.open = function(params, callback) {
        // 원본 PayappLite가 있는지 확인 (대체 객체가 아닌 진짜)
        if (typeof window.originalPayappLite !== 'undefined' && window.originalPayappLite.open) {
            console.log('원본 PayappLite 사용');
            window.originalPayappLite.open(params, callback);
        } else {
            // 없으면 REST API 사용
            console.log('REST API 폴백 사용');
            this.requestPayment(params, callback);
        }
    };
}

// 전역 객체로 노출
window.PayappPayment = PayappPayment;