// manodm@naver.com 주문 데이터 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkManodmOrders() {
  console.log('\n=== manodm@naver.com 주문 데이터 확인 ===\n');

  try {
    // 1. 오늘 날짜의 모든 주문 조회
    console.log('1. 오늘 날짜의 모든 주문 조회');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false })
      .limit(10);

    if (todayError) {
      console.error('❌ 오늘 주문 조회 실패:', todayError);
    } else {
      console.log(`✅ 오늘 ${todayOrders.length}개의 주문 발견`);
      todayOrders.forEach(order => {
        console.log(`  - ${order.order_number}: ${order.customer_email} (${order.status}) - ${new Date(order.created_at).toLocaleString('ko-KR')}`);
      });
    }

    // 2. manodm@naver.com 정확한 이메일로 조회
    console.log('\n2. manodm@naver.com 정확한 이메일로 조회');
    const { data: manodmOrders, error: manodmError } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', 'manodm@naver.com')
      .order('created_at', { ascending: false });

    if (manodmError) {
      console.error('❌ manodm 조회 실패:', manodmError);
    } else {
      console.log(`✅ manodm@naver.com 주문 ${manodmOrders.length}개 발견`);
      if (manodmOrders.length > 0) {
        manodmOrders.forEach(order => {
          console.log(`  상세 정보:`);
          console.log(`    주문번호: ${order.order_number}`);
          console.log(`    고객명: ${order.customer_name}`);
          console.log(`    이메일: ${order.customer_email}`);
          console.log(`    패키지: ${order.package_name}`);
          console.log(`    금액: ${order.amount?.toLocaleString()}원`);
          console.log(`    상태: ${order.status}`);
          console.log(`    생성시간: ${new Date(order.created_at).toLocaleString('ko-KR')}`);
          console.log('    ---');
        });
      } else {
        console.log('  manodm@naver.com으로 등록된 주문이 없습니다.');
      }
    }

    // 3. manodm 문자열을 포함하는 이메일 조회 (LIKE 검색)
    console.log('\n3. "manodm" 문자열을 포함하는 이메일 조회');
    const { data: likeOrders, error: likeError } = await supabase
      .from('orders')
      .select('*')
      .like('customer_email', '%manodm%')
      .order('created_at', { ascending: false });

    if (likeError) {
      console.error('❌ LIKE 검색 실패:', likeError);
    } else {
      console.log(`✅ "manodm"을 포함하는 이메일 주문 ${likeOrders.length}개 발견`);
      if (likeOrders.length > 0) {
        likeOrders.forEach(order => {
          console.log(`  - ${order.order_number}: ${order.customer_email} (${order.status})`);
        });
      }
    }

    // 4. 최근 1시간 내 모든 주문 조회
    console.log('\n4. 최근 1시간 내 모든 주문 조회');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ 최근 주문 조회 실패:', recentError);
    } else {
      console.log(`✅ 최근 1시간 내 ${recentOrders.length}개의 주문 발견`);
      if (recentOrders.length > 0) {
        recentOrders.forEach(order => {
          console.log(`  - ${order.order_number}: ${order.customer_email} (${order.status}) - ${new Date(order.created_at).toLocaleString('ko-KR')}`);
        });
      } else {
        console.log('  최근 1시간 내 주문이 없습니다.');
      }
    }

    // 5. 전체 이메일 목록 (중복 제거)
    console.log('\n5. 데이터베이스의 모든 고유 이메일 목록');
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('customer_email')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ 이메일 목록 조회 실패:', allError);
    } else {
      const uniqueEmails = [...new Set(allOrders.map(order => order.customer_email))];
      console.log(`✅ 총 ${uniqueEmails.length}개의 고유 이메일:`);
      uniqueEmails.forEach(email => {
        console.log(`  - ${email}`);
      });
    }

    console.log('\n=== 확인 완료 ===');

  } catch (error) {
    console.error('❌ 확인 중 오류:', error);
  }
}

checkManodmOrders();