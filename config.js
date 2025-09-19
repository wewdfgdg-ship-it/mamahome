// 페이앱 결제 API 설정
// ⚠️ 이 파일은 Git에 커밋되지 않습니다 (.gitignore에 추가됨)
// ⚠️ 실제 서비스 배포 시 이 파일을 서버에 직접 업로드하세요

const PAYAPP_CONFIG = {
    // 페이앱에서 발급받은 가맹점 ID
    userid: 'ksbm',

    // 페이앱에서 발급받은 연동키
    linkkey: 'QLo9WUgFwaqAYjAiv6z86e1DPJnCCRVaOgT+oqg6zaM=',

    // 결제 완료 후 서버로 전송되는 콜백 URL
    // 에러 70080 방지를 위해 빈 값으로 설정 (페이앱이 접속할 수 없는 경우)
    feedbackurl: '',

    // 결제 완료 후 사용자가 리다이렉트되는 URL
    returnurl: '',  // 빈 값 = 현재 도메인 사용

    // 개발/운영 환경 설정
    environment: 'production'
};

// 개발 환경에서 사용할 테스트 설정
const PAYAPP_TEST_CONFIG = {
    userid: 'meble_test',
    linkkey: '',
    feedbackurl: 'http://localhost:3000/api/payment/callback',
    returnurl: 'http://localhost:3000/payment-complete',
    environment: 'development'
};

// 환경에 따라 설정 선택
// 실제 결제를 위해 항상 PAYAPP_CONFIG 사용
const CONFIG = PAYAPP_CONFIG;