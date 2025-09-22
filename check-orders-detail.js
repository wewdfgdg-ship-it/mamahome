// 상세한 주문 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkOrdersDetail() {
  console.log('\n=== 주문 데이터 상세 분석 ===\n');

  try {
    // 1. 전체 주문 데이터 조회
    console.log('1. 전체 주문 데이터 조회');
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ 주문 조회 실패:', ordersError);
      return;
    }

    console.log(`✅ 총 ${allOrders.length}개의 주문 발견\n`);

    // 2. 이메일별 주문 통계
    console.log('2. 이메일별 주문 통계');
    const emailStats = {};
    allOrders.forEach(order => {
      const email = order.customer_email || 'no-email';
      if (!emailStats[email]) {
        emailStats[email] = {
          count: 0,
          orders: []
        };
      }
      emailStats[email].count++;
      emailStats[email].orders.push({
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at
      });
    });

    console.log('이메일별 주문 현황:');
    Object.entries(emailStats).forEach(([email, stats]) => {
      console.log(`  - ${email}: ${stats.count}개 주문`);
      stats.orders.forEach(order => {
        console.log(`    • ${order.order_number} (${order.status}) - ${new Date(order.created_at).toLocaleString('ko-KR')}`);
      });
    });

    // 3. 상태별 주문 통계
    console.log('\n3. 상태별 주문 통계');
    const statusStats = {};
    allOrders.forEach(order => {
      const status = order.status || 'unknown';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    console.log('상태별 주문 수:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}개`);
    });

    // 4. 최근 24시간 주문 확인
    console.log('\n4. 최근 24시간 내 주문');
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentOrders = allOrders.filter(order => order.created_at > oneDayAgo);

    if (recentOrders.length > 0) {
      console.log(`최근 24시간 내 ${recentOrders.length}개 주문:`);
      recentOrders.forEach(order => {
        console.log(`  - ${order.order_number}`);
        console.log(`    고객: ${order.customer_name} (${order.customer_email})`);
        console.log(`    상품: ${order.package_name}`);
        console.log(`    금액: ${order.amount?.toLocaleString()}원`);
        console.log(`    상태: ${order.status}`);
        console.log(`    시간: ${new Date(order.created_at).toLocaleString('ko-KR')}`);
      });
    } else {
      console.log('최근 24시간 내 주문이 없습니다.');
    }

    // 5. 빈 이메일 또는 누락된 정보 체크
    console.log('\n5. 데이터 품질 체크');
    const dataIssues = {
      noEmail: allOrders.filter(o => !o.customer_email).length,
      noName: allOrders.filter(o => !o.customer_name).length,
      noOrderNumber: allOrders.filter(o => !o.order_number).length,
      noAmount: allOrders.filter(o => !o.amount).length
    };

    console.log('데이터 누락 현황:');
    console.log(`  - 이메일 없음: ${dataIssues.noEmail}개`);
    console.log(`  - 이름 없음: ${dataIssues.noName}개`);
    console.log(`  - 주문번호 없음: ${dataIssues.noOrderNumber}개`);
    console.log(`  - 금액 없음: ${dataIssues.noAmount}개`);

    // 6. 특정 이메일로 조회 테스트
    console.log('\n6. 특정 이메일로 조회 테스트');
    const testEmails = ['12345@test.com', 'test@example.com', 'hong@example.com'];

    for (const testEmail of testEmails) {
      const { data: userOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', testEmail);

      if (error) {
        console.log(`  ❌ ${testEmail} 조회 실패:`, error.message);
      } else {
        console.log(`  - ${testEmail}: ${userOrders.length}개 주문 발견`);
      }
    }

    console.log('\n=== 분석 완료 ===');

  } catch (error) {
    console.error('❌ 분석 중 오류:', error);
  }
}

checkOrdersDetail();