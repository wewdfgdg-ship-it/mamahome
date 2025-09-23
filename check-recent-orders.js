// Check for recent orders and specific email
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkRecentOrders() {
  try {
    console.log('=== 최근 2시간 주문 확인 ===');

    // 1. 최근 2시간 내 모든 주문
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', twoHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ 최근 주문 조회 실패:', recentError.message);
    } else {
      console.log(`✅ 최근 2시간 내 주문: ${recentOrders.length}개`);
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. [${order.order_number}] ${order.customer_name} (${order.customer_email}) - ${new Date(order.created_at).toLocaleString('ko-KR')}`);
      });
    }

    console.log('\n=== manodm@naver.com 주문 확인 ===');

    // 2. manodm@naver.com 관련 주문 검색
    const { data: emailOrders, error: emailError } = await supabase
      .from('orders')
      .select('*')
      .or('customer_email.eq.manodm@naver.com,buyer_email.eq.manodm@naver.com,customer_email.ilike.%manodm%')
      .order('created_at', { ascending: false });

    if (emailError) {
      console.error('❌ 이메일 주문 조회 실패:', emailError.message);
    } else {
      console.log(`✅ manodm 관련 주문: ${emailOrders.length}개`);
      emailOrders.forEach((order, index) => {
        console.log(`${index + 1}. [${order.order_number}] ${order.customer_name} (${order.customer_email}) - ${new Date(order.created_at).toLocaleString('ko-KR')}`);
      });
    }

    console.log('\n=== 전체 최근 5개 주문 ===');

    // 3. 최근 5개 주문 (날짜 무관)
    const { data: lastOrders, error: lastError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (lastError) {
      console.error('❌ 최근 주문 조회 실패:', lastError.message);
    } else {
      console.log(`✅ 최근 5개 주문:`);
      lastOrders.forEach((order, index) => {
        console.log(`${index + 1}. [${order.order_number}] ${order.customer_name} (${order.customer_email}) - ${new Date(order.created_at).toLocaleString('ko-KR')} - 상태: ${order.status}`);
        if (order.payment_method) console.log(`   결제방법: ${order.payment_method}, 금액: ${order.amount?.toLocaleString()}원`);
      });
    }

    console.log('\n=== 오늘 주문 확인 ===');

    // 4. 오늘 주문
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (todayError) {
      console.error('❌ 오늘 주문 조회 실패:', todayError.message);
    } else {
      console.log(`✅ 오늘 주문: ${todayOrders.length}개`);
      todayOrders.forEach((order, index) => {
        console.log(`${index + 1}. [${order.order_number}] ${order.customer_name} (${order.customer_email}) - ${new Date(order.created_at).toLocaleString('ko-KR')} - 상태: ${order.status}`);
      });
    }

  } catch (error) {
    console.error('❌ 조회 중 오류 발생:', error);
  }
}

checkRecentOrders();