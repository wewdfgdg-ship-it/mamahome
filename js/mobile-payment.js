// 모바일 결제 헬퍼 모듈
const MobilePaymentHelper = {
    // 디바이스 감지
    isMobile() {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    },

    isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    },

    isAndroid() {
        return /Android/i.test(navigator.userAgent);
    },

    // 인앱 브라우저 감지
    isInAppBrowser() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;

        // 카카오톡
        if (ua.includes('KAKAOTALK')) return 'kakaotalk';

        // 네이버 앱
        if (ua.includes('NAVER')) return 'naver';

        // 페이스북
        if (ua.includes('FBAN') || ua.includes('FBAV')) return 'facebook';

        // 인스타그램
        if (ua.includes('Instagram')) return 'instagram';

        // 기타 인앱
        if (ua.includes('wv') || ua.includes('WebView')) return 'webview';

        return false;
    },

    // PayApp 모바일 결제 URL 생성 (공식 문서 기반)
    generatePayAppUrl(params) {
        const baseUrl = 'https://pay.payapp.kr/pay/pay.php';
        const config = {
            userid: 'mamahome',
            linkkey: '61eebef6f37f02f0af24a8dd27eed9bd',
            shopname: params.shopname || params.goodname || '미블 체험단',  // shopname 필수
            goodname: params.goodname || '미블 체험단 서비스',  // 상품명
            price: params.price || 0,
            recvphone: params.phone || params.buyerphone || '',  // recvphone 필수
            buyer: params.buyer || '',
            buyeremail: params.email || '',
            returnurl: params.returnurl || window.location.origin + '/pages/payment-complete.html',
            feedbackurl: params.feedbackurl || window.location.origin + '/api/payapp-webhook',
            var1: params.var1 || '',
            var2: params.var2 || '',
            smsuse: 'n',
            openpaytype: params.payType || 'card'  // 기본값 카드
        };

        const queryString = Object.keys(config)
            .map(key => `${key}=${encodeURIComponent(config[key])}`)
            .join('&');

        return `${baseUrl}?${queryString}`;
    },

    // 결제 방식 선택
    selectPaymentMethod(params) {
        const inApp = this.isInAppBrowser();

        // 인앱 브라우저인 경우 경고 후 외부 브라우저로 유도
        if (inApp) {
            return {
                type: 'redirect',
                message: '안전한 결제를 위해 기본 브라우저에서 진행해주세요.',
                url: this.generatePayAppUrl(params)
            };
        }

        // 일반 모바일 브라우저
        if (this.isMobile()) {
            return {
                type: 'redirect',
                url: this.generatePayAppUrl(params)
            };
        }

        // PC
        return {
            type: 'iframe',
            url: params.iframeUrl || '/pages/payapp-frame.html'
        };
    },

    // 결제 실행
    executePayment(params) {
        const method = this.selectPaymentMethod(params);

        if (method.message) {
            alert(method.message);
        }

        if (method.type === 'redirect') {
            // 결제 정보 저장
            sessionStorage.setItem('paymentData', JSON.stringify(params));

            // 리다이렉트
            window.location.href = method.url;
        } else if (method.type === 'iframe') {
            // iframe 결제 (PC)
            this.openPaymentIframe(method.url, params);
        }
    },

    // iframe 결제 창 열기 (PC용)
    openPaymentIframe(url, params) {
        // iframe 또는 팝업으로 결제 진행
        const iframe = document.createElement('iframe');
        iframe.src = url + '?' + new URLSearchParams(params).toString();
        iframe.style.position = 'fixed';
        iframe.style.top = '50%';
        iframe.style.left = '50%';
        iframe.style.transform = 'translate(-50%, -50%)';
        iframe.style.width = '500px';
        iframe.style.height = '700px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '12px';
        iframe.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
        iframe.style.zIndex = '10000';

        // 배경 오버레이
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.zIndex = '9999';
        overlay.id = 'payment-overlay';

        overlay.onclick = () => {
            if (confirm('결제를 취소하시겠습니까?')) {
                document.body.removeChild(overlay);
                document.body.removeChild(iframe);
            }
        };

        document.body.appendChild(overlay);
        document.body.appendChild(iframe);
    },

    // 결제 결과 처리
    handlePaymentResult() {
        // URL 파라미터에서 결제 결과 확인
        const urlParams = new URLSearchParams(window.location.search);
        const state = urlParams.get('state');
        const orderid = urlParams.get('orderid');

        if (state === 'success' || state === 'SUCCESS') {
            return {
                success: true,
                orderid: orderid,
                data: Object.fromEntries(urlParams)
            };
        } else if (state === 'cancel' || state === 'CANCEL') {
            return {
                success: false,
                error: 'CANCELLED',
                message: '결제가 취소되었습니다.'
            };
        } else if (state === 'error' || state === 'ERROR') {
            return {
                success: false,
                error: 'ERROR',
                message: urlParams.get('message') || '결제 처리 중 오류가 발생했습니다.'
            };
        }

        return null;
    },

    // 앱 스킴 처리 (필요시 사용)
    handleAppScheme(scheme) {
        // 앱 스킴 실행 시도
        const startTime = Date.now();

        // 앱 실행 시도
        window.location.href = scheme;

        // 3초 후 앱이 실행되지 않았으면 에러 처리
        setTimeout(() => {
            const endTime = Date.now();
            if (endTime - startTime < 3000) {
                // 앱이 실행되지 않음 (페이지가 그대로 있음)
                this.handleAppNotInstalled();
            }
        }, 3000);
    },

    // 앱 미설치 처리
    handleAppNotInstalled() {
        if (confirm('앱이 설치되어 있지 않습니다. 웹에서 결제를 진행하시겠습니까?')) {
            const paymentData = JSON.parse(sessionStorage.getItem('paymentData') || '{}');
            window.location.href = this.generatePayAppUrl(paymentData);
        }
    }
};

// 전역으로 노출
window.MobilePaymentHelper = MobilePaymentHelper;