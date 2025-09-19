// Supabase 연결 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 환경변수 확인
console.log('=== 환경변수 확인 ===');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 없음');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다!');
  process.exit(1);
}

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('\n=== Supabase 연결 테스트 ===');

    // 1. orders 테이블 조회 테스트
    console.log('\n1. Orders 테이블 조회 테스트...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);

    if (ordersError) {
      console.error('❌ Orders 조회 실패:', ordersError.message);
    } else {
      console.log(`✅ Orders 조회 성공! ${orders.length}개 주문 발견`);
      if (orders.length > 0) {
        console.log('첫 번째 주문:', orders[0]);
      }
    }

    // 2. 테스트 주문 생성
    console.log('\n2. 테스트 주문 생성 중...');
    const testOrder = {
      order_number: `TEST-${Date.now()}`,
      customer_name: '테스트 고객',
      customer_email: 'test@example.com',
      customer_phone: '010-0000-0000',
      business_name: '테스트 회사',
      business_number: '000-00-00000',
      package_name: '테스트 패키지',
      package_price: 10000,
      amount: 10000,
      payment_method: 'test',
      status: 'test',
      notes: 'Supabase 연결 테스트'
    };

    const { data: newOrder, error: createError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();

    if (createError) {
      console.error('❌ 주문 생성 실패:', createError.message);
    } else {
      console.log('✅ 테스트 주문 생성 성공!');
      console.log('생성된 주문:', newOrder[0]);

      // 3. 생성한 주문 삭제
      if (newOrder[0].id) {
        console.log('\n3. 테스트 주문 삭제 중...');
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', newOrder[0].id);

        if (deleteError) {
          console.error('❌ 주문 삭제 실패:', deleteError.message);
        } else {
          console.log('✅ 테스트 주문 삭제 성공!');
        }
      }
    }

    console.log('\n=== 테스트 완료 ===');
    console.log('✅ Supabase 연결이 정상적으로 작동합니다!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

testConnection();