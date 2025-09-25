// Orders 테이블 상세 분석 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function analyzeOrders() {
  try {
    console.log('📊 Orders 테이블 상세 분석 시작\n');

    // 1. 전체 주문 개수 확인
    console.log('1️⃣ 전체 주문 개수 확인');
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 주문 개수 조회 실패:', countError.message);
    } else {
      console.log(`✅ 전체 주문 개수: ${count}개\n`);
    }

    // 2. 최근 5개 주문의 상세 정보 조회
    console.log('2️⃣ 최근 5개 주문 상세 정보');
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('customer_email, order_number, created_at, customer_name, status, amount, payment_method')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ 최근 주문 조회 실패:', recentError.message);
    } else {
      console.log(`✅ 최근 5개 주문:`);
      recentOrders.forEach((order, index) => {
        console.log(`   ${index + 1}. 주문번호: ${order.order_number}`);
        console.log(`      고객이메일: ${order.customer_email}`);
        console.log(`      고객이름: ${order.customer_name}`);
        console.log(`      생성일시: ${new Date(order.created_at).toLocaleString('ko-KR')}`);
        console.log(`      상태: ${order.status}`);
        console.log(`      금액: ${order.amount?.toLocaleString()}원`);
        console.log(`      결제방법: ${order.payment_method}`);
        console.log('');
      });
    }

    // 3. 고유한 고객 이메일 목록
    console.log('3️⃣ 고유한 고객 이메일 목록');
    const { data: uniqueEmails, error: emailError } = await supabase
      .from('orders')
      .select('customer_email')
      .not('customer_email', 'is', null);

    if (emailError) {
      console.error('❌ 이메일 조회 실패:', emailError.message);
    } else {
      const distinctEmails = [...new Set(uniqueEmails.map(item => item.customer_email))];
      console.log(`✅ 고유한 고객 이메일 개수: ${distinctEmails.length}개`);
      console.log('이메일 목록:');
      distinctEmails.forEach((email, index) => {
        console.log(`   ${index + 1}. ${email}`);
      });
      console.log('');
    }

    // 4. 특정 이메일별 주문 개수 확인
    console.log('4️⃣ 이메일별 주문 개수');
    for (const email of [...new Set(uniqueEmails.map(item => item.customer_email))]) {
      const { count: emailCount, error: emailCountError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_email', email);

      if (!emailCountError) {
        console.log(`   ${email}: ${emailCount}개 주문`);
      }
    }
    console.log('');

    // 5. 테이블 스키마 정보 (첫 번째 행으로 구조 파악)
    console.log('5️⃣ Orders 테이블 스키마 구조');
    const { data: schemaData, error: schemaError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ 스키마 조회 실패:', schemaError.message);
    } else if (schemaData && schemaData.length > 0) {
      console.log('✅ 테이블 컬럼 구조:');
      Object.keys(schemaData[0]).forEach((column, index) => {
        const value = schemaData[0][column];
        const type = value === null ? 'null' : typeof value;
        console.log(`   ${index + 1}. ${column} (${type})`);
      });
    }

    // 6. 상태별 주문 분석
    console.log('\n6️⃣ 상태별 주문 분석');
    const { data: statusData, error: statusError } = await supabase
      .from('orders')
      .select('status');

    if (statusError) {
      console.error('❌ 상태 분석 실패:', statusError.message);
    } else {
      const statusCounts = statusData.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      console.log('✅ 상태별 주문 개수:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}개`);
      });
    }

    // 7. 결제방법별 분석
    console.log('\n7️⃣ 결제방법별 주문 분석');
    const { data: paymentData, error: paymentError } = await supabase
      .from('orders')
      .select('payment_method, amount');

    if (paymentError) {
      console.error('❌ 결제방법 분석 실패:', paymentError.message);
    } else {
      const paymentStats = paymentData.reduce((acc, item) => {
        const method = item.payment_method || 'unknown';
        if (!acc[method]) {
          acc[method] = { count: 0, totalAmount: 0 };
        }
        acc[method].count += 1;
        acc[method].totalAmount += item.amount || 0;
        return acc;
      }, {});

      console.log('✅ 결제방법별 통계:');
      Object.entries(paymentStats).forEach(([method, stats]) => {
        console.log(`   ${method}: ${stats.count}개 주문, 총 ${stats.totalAmount.toLocaleString()}원`);
      });
    }

    console.log('\n📊 분석 완료!');

  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error);
  }
}

analyzeOrders();