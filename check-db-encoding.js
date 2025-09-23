// 데이터베이스 인코딩 및 테이블 구조 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkDatabaseEncoding() {
  try {
    console.log('=== 데이터베이스 인코딩 및 구조 확인 ===\n');

    // 1. 특정 깨진 데이터 재확인
    console.log('1. 특정 주문의 원본 데이터 확인');
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', 'TEST-MANUAL-1758594914')
      .single();

    if (error) {
      console.error('❌ 주문 조회 실패:', error.message);
    } else {
      console.log('주문 데이터:', order);
      console.log(`\npackage_name 상세 분석:`);
      console.log(`  값: "${order.package_name}"`);
      console.log(`  16진수: ${Buffer.from(order.package_name, 'utf8').toString('hex')}`);
      console.log(`  바이트 배열: [${[...Buffer.from(order.package_name, 'utf8')].join(', ')}]`);

      // 다양한 인코딩으로 디코딩 시도
      const bytes = Buffer.from(order.package_name, 'utf8');

      console.log('\n다양한 인코딩으로 디코딩 시도:');
      try {
        // EUC-KR로 디코딩 시도 (iconv-lite 필요)
        console.log(`  원본: "${order.package_name}"`);
        console.log(`  UTF-8: "${bytes.toString('utf8')}"`);
        console.log(`  Latin1: "${bytes.toString('latin1')}"`);
        console.log(`  ASCII: "${bytes.toString('ascii')}"`);
      } catch (e) {
        console.log(`  인코딩 변환 오류: ${e.message}`);
      }
    }

    // 2. 새로운 테스트 데이터 삽입해서 인코딩 확인
    console.log('\n\n2. 인코딩 테스트용 주문 생성');
    const testOrder = {
      order_number: `ENCODING-TEST-${Date.now()}`,
      customer_name: '한글테스트고객',
      customer_email: 'encoding@test.com',
      customer_phone: '010-9999-8888', // 실제 전화번호 형식
      business_name: '한글테스트회사',
      business_number: '123-45-67890',
      package_name: '한글패키지테스트',
      package_price: 50000,
      amount: 50000,
      payment_method: 'encoding_test',
      status: 'test',
      notes: '한글 인코딩 테스트 주문입니다. 특수문자: !@#$%^&*()'
    };

    console.log('삽입할 데이터:', testOrder);

    const { data: newOrder, error: createError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();

    if (createError) {
      console.error('❌ 테스트 주문 생성 실패:', createError.message);
    } else {
      console.log('✅ 테스트 주문 생성 성공!');
      const created = newOrder[0];

      console.log('\n삽입 후 조회된 데이터:');
      console.log(`  customer_name: "${created.customer_name}"`);
      console.log(`  business_name: "${created.business_name}"`);
      console.log(`  package_name: "${created.package_name}"`);
      console.log(`  customer_phone: "${created.customer_phone}"`);
      console.log(`  notes: "${created.notes}"`);

      // 바로 다시 조회해서 확인
      const { data: reQueried, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', created.id)
        .single();

      if (queryError) {
        console.error('❌ 재조회 실패:', queryError.message);
      } else {
        console.log('\n재조회 결과:');
        console.log(`  customer_name: "${reQueried.customer_name}"`);
        console.log(`  package_name: "${reQueried.package_name}"`);
        console.log(`  customer_phone: "${reQueried.customer_phone}"`);

        // 원본과 재조회 데이터 비교
        const fields = ['customer_name', 'business_name', 'package_name', 'customer_phone', 'notes'];
        console.log('\n원본 vs 재조회 비교:');
        fields.forEach(field => {
          const original = testOrder[field];
          const queried = reQueried[field];
          const matches = original === queried;
          console.log(`  ${field}: ${matches ? '✅' : '❌'}`);
          if (!matches) {
            console.log(`    원본: "${original}"`);
            console.log(`    조회: "${queried}"`);
          }
        });
      }

      // 테스트 주문 삭제
      console.log('\n3. 테스트 주문 삭제');
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', created.id);

      if (deleteError) {
        console.error('❌ 테스트 주문 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 테스트 주문 삭제 성공');
      }
    }

    // 3. 프론트엔드에서 실제로 보내는 데이터 형식 확인
    console.log('\n\n4. 실제 결제 폼 데이터 시뮬레이션');

    // PayApp 결제에서 실제로 전송되는 데이터 형식 재현
    const realFormData = {
      order_number: `REAL-TEST-${Date.now()}`,
      customer_name: '김한글',
      customer_email: 'korean@test.com',
      customer_phone: '010-5555-7777',
      business_name: '한글회사명',
      business_number: '123-45-67890',
      package_name: '미블 체험단 서비스',
      package_price: 110000,
      amount: 110000,
      payment_method: 'PayApp',
      status: 'pending',
      notes: '실제 폼 데이터 테스트'
    };

    // JSON.stringify로 직렬화 후 다시 파싱 (웹에서 전송되는 과정 시뮬레이션)
    const jsonString = JSON.stringify(realFormData);
    const parsedData = JSON.parse(jsonString);

    console.log('JSON 직렬화/파싱 테스트:');
    console.log(`원본 customer_name: "${realFormData.customer_name}"`);
    console.log(`JSON 후 customer_name: "${parsedData.customer_name}"`);
    console.log(`일치 여부: ${realFormData.customer_name === parsedData.customer_name ? '✅' : '❌'}`);

    // 4. URL 인코딩 테스트 (폼 전송 시 발생할 수 있는 문제)
    console.log('\n\n5. URL 인코딩/디코딩 테스트');

    const testText = '미블 체험단';
    const encoded = encodeURIComponent(testText);
    const decoded = decodeURIComponent(encoded);

    console.log(`원본: "${testText}"`);
    console.log(`URL 인코딩: "${encoded}"`);
    console.log(`URL 디코딩: "${decoded}"`);
    console.log(`일치 여부: ${testText === decoded ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ 인코딩 확인 중 오류 발생:', error);
  }
}

checkDatabaseEncoding();