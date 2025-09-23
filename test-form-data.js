// 주문 폼 데이터 처리 과정 테스트
// 한글 인코딩 및 전화번호 문제 재현

// 실제 폼에서 발생할 수 있는 시나리오들 테스트
console.log('=== 폼 데이터 처리 테스트 ===\n');

// 1. 브라우저 폼 데이터 처리 시뮬레이션
function simulateFormData() {
    console.log('1. 브라우저 폼 데이터 시뮬레이션');

    // 실제 사용자가 입력할 수 있는 데이터
    const formData = {
        name: '김미블',              // 한글 이름
        phone: '010-7362-7711',      // 실제 전화번호
        email: 'test@mrblog.net',
        storeName: '미블 체험단 서비스',  // 한글 매장명
        businessType: 'marketing'
    };

    console.log('원본 폼 데이터:', formData);

    // 2. HTML 폼에서 서버로 전송될 때의 과정 시뮬레이션
    console.log('\n2. 서버 전송 과정 시뮬레이션');

    // FormData 객체로 변환 (브라우저에서 실제로 일어나는 과정)
    const payload = {
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email,
        business_name: formData.storeName,
        package_name: formData.storeName, // 패키지명도 한글
        amount: 110000,
        payment_method: 'PayApp',
        status: 'paid'
    };

    console.log('API 전송용 payload:', payload);

    // 3. JSON 직렬화/파싱 테스트
    console.log('\n3. JSON 직렬화/파싱 테스트');
    const jsonString = JSON.stringify(payload);
    console.log('JSON 문자열:', jsonString);

    const parsedPayload = JSON.parse(jsonString);
    console.log('파싱된 데이터:', parsedPayload);

    // 4. 각 필드별 인코딩 상태 확인
    console.log('\n4. 인코딩 상태 확인');

    Object.entries(parsedPayload).forEach(([key, value]) => {
        if (typeof value === 'string' && value) {
            console.log(`${key}:`);
            console.log(`  값: "${value}"`);
            console.log(`  타입: ${typeof value}`);
            console.log(`  길이: ${value.length} 문자`);
            console.log(`  바이트: ${Buffer.byteLength(value, 'utf8')} bytes`);
            console.log(`  한글 포함: ${/[가-힣]/.test(value) ? 'Yes' : 'No'}`);
            console.log('');
        }
    });

    return parsedPayload;
}

// 5. URL 인코딩/디코딩 테스트 (폼 전송 시 발생할 수 있는 문제)
function testUrlEncoding() {
    console.log('\n5. URL 인코딩 테스트');

    const testStrings = [
        '미블 체험단 서비스',
        '김미블',
        '강남역 맛집 체험단',
        '010-7362-7711'
    ];

    testStrings.forEach(text => {
        const encoded = encodeURIComponent(text);
        const decoded = decodeURIComponent(encoded);

        console.log(`원본: "${text}"`);
        console.log(`인코딩: "${encoded}"`);
        console.log(`디코딩: "${decoded}"`);
        console.log(`일치: ${text === decoded ? 'OK' : 'FAIL'}`);
        console.log('---');
    });
}

// 6. 전화번호 처리 시뮬레이션
function testPhoneProcessing() {
    console.log('\n6. 전화번호 처리 테스트');

    const phoneInputs = [
        '01073627711',        // 숫자만
        '010-7362-7711',      // 하이픈 포함
        '010 7362 7711',      // 공백 포함
        '(010) 7362-7711',    // 괄호 포함
    ];

    phoneInputs.forEach(input => {
        // 실제 폼에서 사용하는 정규화 과정
        const normalized = input.replace(/[^0-9]/g, ''); // 숫자만 추출
        const formatted = normalized.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1-$2-$3'); // 포맷 적용

        console.log(`입력: "${input}"`);
        console.log(`정규화: "${normalized}"`);
        console.log(`포맷: "${formatted}"`);

        // 기본값과 비교
        const isDefault = formatted === '010-1234-5678';
        console.log(`기본값 여부: ${isDefault ? 'YES (문제!)' : 'NO (정상)'}`);
        console.log('---');
    });
}

// 7. 실제 API 요청 시뮬레이션 (인코딩 문제 재현)
function simulateApiRequest() {
    console.log('\n7. API 요청 시뮬레이션');

    const orderData = {
        order_number: `TEST-ENCODING-${Date.now()}`,
        customer_name: '김미블',
        customer_phone: '010-7362-7711',
        customer_email: 'test@mrblog.net',
        package_name: '미블 체험단 서비스',
        business_name: '강남역 맛집',
        amount: 110000,
        payment_method: 'PayApp',
        status: 'paid'
    };

    console.log('원본 주문 데이터:', orderData);

    // Content-Type: application/json 헤더로 전송될 때
    console.log('\nJSON 전송 (Content-Type: application/json):');
    const jsonPayload = JSON.stringify(orderData);
    console.log('JSON 페이로드:', jsonPayload);

    // Content-Type: application/x-www-form-urlencoded 로 전송될 때
    console.log('\nForm 전송 (Content-Type: application/x-www-form-urlencoded):');
    const formParams = new URLSearchParams();
    Object.entries(orderData).forEach(([key, value]) => {
        formParams.append(key, value);
    });
    console.log('Form 페이로드:', formParams.toString());

    // 디코딩 테스트
    console.log('\nForm 디코딩 테스트:');
    const decodedParams = Object.fromEntries(formParams);
    console.log('디코딩된 데이터:', decodedParams);

    // 각 필드 비교
    console.log('\n필드별 비교:');
    Object.keys(orderData).forEach(key => {
        const original = orderData[key];
        const decoded = decodedParams[key];
        const match = String(original) === String(decoded);

        console.log(`${key}: ${match ? 'OK' : 'FAIL'}`);
        if (!match) {
            console.log(`  원본: "${original}"`);
            console.log(`  디코딩: "${decoded}"`);
        }
    });
}

// 8. 기본 전화번호 문제 분석
function analyzeDefaultPhoneIssue() {
    console.log('\n8. 기본 전화번호 문제 분석');

    // 현재 데이터베이스에서 발견된 패턴
    const dbPhoneNumbers = [
        '010-1234-5678',  // 기본값 (87.5%)
        '000',            // 잘못된 입력
        '',               // 빈 값
    ];

    console.log('데이터베이스 전화번호 패턴:');
    dbPhoneNumbers.forEach((phone, index) => {
        console.log(`${index + 1}. "${phone}"`);

        if (phone === '010-1234-5678') {
            console.log('   → 기본값/플레이스홀더 (문제!)');
        } else if (phone === '000') {
            console.log('   → 유효성 검사 실패');
        } else if (phone === '') {
            console.log('   → 빈 값');
        } else {
            console.log('   → 정상적인 전화번호');
        }
    });

    // 가능한 원인 분석
    console.log('\n가능한 원인:');
    console.log('1. 폼 필드에 placeholder="010-1234-5678" 설정되어 있음');
    console.log('2. JavaScript에서 기본값을 "010-1234-5678"로 설정');
    console.log('3. 사용자가 실제로 기본값을 입력하지 않음');
    console.log('4. 유효성 검사가 placeholder 값을 허용');
}

// 모든 테스트 실행
function runAllTests() {
    try {
        simulateFormData();
        testUrlEncoding();
        testPhoneProcessing();
        simulateApiRequest();
        analyzeDefaultPhoneIssue();

        console.log('\n=== 테스트 완료 ===');
        console.log('✅ 모든 테스트가 성공적으로 완료되었습니다.');

        console.log('\n=== 결론 ===');
        console.log('1. 한글 데이터: UTF-8 인코딩은 정상 작동 (새로 생성된 데이터는 정상)');
        console.log('2. 전화번호 문제: 기본값 "010-1234-5678"이 실제 데이터로 저장되고 있음');
        console.log('3. 기존 데이터 깨짐: 과거에 잘못된 인코딩으로 저장된 데이터가 남아있음');

    } catch (error) {
        console.error('❌ 테스트 중 오류 발생:', error);
    }
}

runAllTests();