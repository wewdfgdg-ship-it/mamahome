<?php
/**
 * 페이앱 결제 콜백 처리
 * 페이앱 서버에서 결제 완료 후 이 URL로 결과를 전송합니다.
 * 
 * 에러 70080 해결:
 * - 이 파일이 feedbackurl에 지정된 경로에 존재해야 함
 * - 반드시 "SUCCESS" 문자열을 응답해야 함
 */

// CORS 헤더 (필요시)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Content-Type: text/plain; charset=UTF-8');

// 결제 결과 파라미터 수신
$state = $_REQUEST['state'] ?? '';
$errorMessage = $_REQUEST['errorMessage'] ?? '';
$mul_no = $_REQUEST['mul_no'] ?? '';  // 페이앱 거래번호
$payurl = $_REQUEST['payurl'] ?? '';
$var1 = $_REQUEST['var1'] ?? '';  // 추가 정보 1
$var2 = $_REQUEST['var2'] ?? '';  // 추가 정보 2
$buyer = $_REQUEST['buyer'] ?? '';
$recvphone = $_REQUEST['recvphone'] ?? '';
$goodname = $_REQUEST['goodname'] ?? '';
$price = $_REQUEST['price'] ?? '';
$paytype = $_REQUEST['paytype'] ?? '';  // 결제 수단

// 결제 성공 여부 확인
if ($state == '1') {
    // 결제 성공 처리
    error_log("PayApp Payment Success: mul_no=$mul_no, buyer=$buyer, price=$price");
    
    // TODO: 여기에 실제 결제 성공 처리 로직 추가
    // - 데이터베이스에 결제 정보 저장
    // - 주문 상태 업데이트
    // - 이메일 발송 등
    
    // 페이앱에 성공 응답 (필수!)
    echo "SUCCESS";
    
} else {
    // 결제 실패 처리
    error_log("PayApp Payment Failed: state=$state, error=$errorMessage");
    
    // TODO: 실패 로그 저장
    
    // 페이앱에 성공 수신 응답 (필수!)
    // FAIL을 응답하면 페이앱이 재시도함
    echo "SUCCESS";
}

// 로그 파일에 기록 (디버깅용)
$logData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'state' => $state,
    'errorMessage' => $errorMessage,
    'mul_no' => $mul_no,
    'buyer' => $buyer,
    'goodname' => $goodname,
    'price' => $price,
    'paytype' => $paytype,
    'var1' => $var1,
    'var2' => $var2,
    'all_params' => $_REQUEST
];

// 로그 파일에 저장 (선택사항)
$logFile = __DIR__ . '/../../logs/payment_callback.log';
$logDir = dirname($logFile);
if (!file_exists($logDir)) {
    mkdir($logDir, 0777, true);
}
file_put_contents($logFile, json_encode($logData, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND);

// 반드시 SUCCESS 응답으로 종료
exit();
?>