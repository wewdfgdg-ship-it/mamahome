<?php
/**
 * 페이앱 API 프록시
 * 프론트엔드의 CORS 문제를 해결하기 위한 서버 프록시
 */

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

// OPTIONS 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 페이앱 API URL
$apiUrl = 'https://api.payapp.kr/oapi/apiLoad.html';

// POST 데이터 받기
$postData = $_POST;

// 필수 파라미터 확인
if (empty($postData['cmd']) || empty($postData['userid']) || empty($postData['linkkey'])) {
    http_response_code(400);
    echo json_encode([
        'state' => '0',
        'errorMessage' => '필수 파라미터가 누락되었습니다.'
    ]);
    exit;
}

// cURL로 페이앱 API 호출
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    // cURL 오류
    http_response_code(500);
    echo json_encode([
        'state' => '0',
        'errorMessage' => '페이앱 서버 연결 실패: ' . $error
    ]);
    exit;
}

// 응답 파싱 (페이앱 응답은 URL 파라미터 형식)
parse_str($response, $result);

// 응답 확인 및 JSON으로 변환
if (isset($result['state']) && $result['state'] == '1') {
    // 성공 응답 - payurl 디코딩
    if (isset($result['payurl'])) {
        $result['payurl'] = urldecode($result['payurl']);
    }
    echo json_encode($result);
} else if (isset($result['state'])) {
    // 실패 응답
    echo json_encode($result);
} else {
    // 응답 형식 오류
    echo json_encode([
        'state' => '0',
        'errorMessage' => '잘못된 응답 형식',
        'raw_response' => $response
    ]);
}
?>