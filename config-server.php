<?php
/**
 * 페이앱 서버 설정 (민감한 정보 포함)
 * 이 파일은 서버에만 존재해야 하며, Git에 커밋하지 않습니다.
 */

// 페이앱 API 설정
define('PAYAPP_USERID', 'ksbm');
define('PAYAPP_LINKKEY', 'QLo9WUgFwaqAYjAiv6z86e1DPJnCCRVaOgT+oqg6zaM=');
define('PAYAPP_FEEDBACKURL', 'https://meble.kr/api/payment/callback');
define('PAYAPP_RETURNURL', 'https://meble.kr/pages/payment-complete.html');

// 환경 설정
define('ENVIRONMENT', 'production');  // 'development' 또는 'production'
?>