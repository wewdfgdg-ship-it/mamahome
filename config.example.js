// 페이앱 결제 API 설정 예제
// 이 파일을 복사하여 config.js로 만들고 실제 값을 입력하세요
// config.js는 .gitignore에 추가되어 있어 Git에 커밋되지 않습니다

const PAYAPP_CONFIG = {
    // 페이앱에서 발급받은 가맹점 ID
    userid: 'your_payapp_userid_here',
    
    // 페이앱에서 발급받은 연동키 (절대 외부 노출 금지!)
    linkkey: 'your_payapp_linkkey_here',
    
    // 결제 완료 후 서버로 전송되는 콜백 URL
    feedbackurl: 'https://meble.kr/api/payment/callback',
    
    // 결제 완료 후 사용자가 리다이렉트되는 URL
    returnurl: 'https://meble.kr/payment-complete',
    
    // 개발/운영 환경 설정
    environment: 'development' // 'development' 또는 'production'
};

// 개발 환경에서 사용할 테스트 설정
const PAYAPP_TEST_CONFIG = {
    userid: 'test_userid',
    linkkey: 'test_linkkey',
    feedbackurl: 'http://localhost:3000/api/payment/callback',
    returnurl: 'http://localhost:3000/payment-complete',
    environment: 'development'
};

// 환경에 따라 설정 선택
const CONFIG = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? PAYAPP_TEST_CONFIG 
    : PAYAPP_CONFIG;