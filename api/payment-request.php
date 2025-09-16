<?php
/**
 * 페이앱 결제 요청 API
 * 프론트엔드에서 전달받은 정보로 페이앱 API에 결제 요청을 전송합니다.
 */

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// OPTIONS 요청 처리 (프리플라이트)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 설정 파일 로드
require_once '../config-server.php';  // 서버용 설정 파일 (민감한 정보 포함)

// 요청 데이터 받기
$input = json_decode(file_get_contents('php://input'), true);

// 필수 파라미터 검증
$required = ['goodname', 'price', 'recvphone', 'buyer'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "필수 정보가 누락되었습니다: $field"
        ]);
        exit;
    }
}

// 페이앱 API 파라미터 구성
$params = [
    'cmd' => 'payrequest',
    'userid' => PAYAPP_USERID,
    'linkkey' => PAYAPP_LINKKEY,
    'goodname' => $input['goodname'],
    'price' => $input['price'],
    'recvphone' => preg_replace('/[^0-9]/', '', $input['recvphone']),
    'buyer' => $input['buyer'],
    'email' => $input['email'] ?? '',
    'memo' => $input['memo'] ?? '',
    'reqaddr' => '0',
    'smsuse' => 'y',
    'feedbackurl' => PAYAPP_FEEDBACKURL,
    'var1' => $input['var1'] ?? '',
    'var2' => $input['var2'] ?? ''
];

// 페이앱 API 호출
$apiUrl = 'https://api.payapp.kr/oapi/apiLoad.html';
$queryString = http_build_query($params);
$fullUrl = $apiUrl . '?' . $queryString;

// cURL로 API 호출
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $fullUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// 응답 파싱
if ($response !== false) {
    // 페이앱 응답 파싱 (파라미터 형식)
    parse_str($response, $result);
    
    if (isset($result['state']) && $result['state'] == '1') {
        // 성공
        echo json_encode([
            'success' => true,
            'message' => '결제 요청이 완료되었습니다. SMS를 확인해주세요.',
            'orderid' => $result['orderid'] ?? '',
            'data' => $result
        ]);
    } else {
        // 실패
        $errorMsg = $result['errorMessage'] ?? '결제 요청 처리 중 오류가 발생했습니다.';
        echo json_encode([
            'success' => false,
            'message' => $errorMsg,
            'data' => $result
        ]);
    }
} else {
    // API 호출 실패
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '페이앱 서버에 연결할 수 없습니다.'
    ]);
}
?>