// users 테이블과 orders 연관성 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkUsersAndOrders() {
  console.log('\n=== Users 테이블과 Orders 연관성 분석 ===\n');

  try {
    // 1. Users 테이블 확인
    console.log('1. Users 테이블 데이터 확인');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Users 테이블 조회 실패:', usersError.message);
      console.log('   Users 테이블이 없거나 접근 권한이 없을 수 있습니다.');
    } else {
      console.log(`✅ 총 ${users?.length || 0}명의 사용자 발견\n`);

      if (users && users.length > 0) {
        console.log('등록된 사용자 목록:');
        users.forEach(user => {
          console.log(`  - ${user.name || '이름없음'} (${user.email})`);
          console.log(`    가입일: ${new Date(user.created_at).toLocaleString('ko-KR')}`);
        });
      }
    }

    // 2. Orders와 매칭 분석
    console.log('\n2. 사용자별 주문 매칭 분석');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('customer_email, customer_name, order_number, status');

    if (!ordersError && orders) {
      const uniqueEmails = [...new Set(orders.map(o => o.customer_email))];

      console.log(`\n주문 테이블의 고유 이메일: ${uniqueEmails.length}개`);
      uniqueEmails.forEach(email => {
        const orderCount = orders.filter(o => o.customer_email === email).length;
        const isUserRegistered = users?.some(u => u.email === email) || false;

        console.log(`  - ${email}: ${orderCount}개 주문`);
        console.log(`    회원가입 여부: ${isUserRegistered ? '✅ 가입됨' : '❌ 미가입'}`);
      });
    }

    // 3. 실제 대시보드에서 사용될 조회 시뮬레이션
    console.log('\n3. 대시보드 조회 시뮬레이션');

    // 테스트용 사용자 이메일들
    const testUserEmails = ['12345@test.com', 'test@example.com', 'test@mrble.com'];

    for (const userEmail of testUserEmails) {
      console.log(`\n[${userEmail}] 사용자로 로그인했을 때:`);

      // 해당 이메일로 주문 조회
      const { data: userOrders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.log(`  ❌ 조회 실패: ${error.message}`);
      } else {
        console.log(`  ✅ ${userOrders?.length || 0}개 주문 발견`);
        if (userOrders && userOrders.length > 0) {
          userOrders.forEach(order => {
            console.log(`    - ${order.order_number} (${order.status}) - ${order.package_name}`);
          });
        }
      }
    }

    // 4. 문제 진단
    console.log('\n4. 문제 진단 및 해결방안');
    console.log('\n발견된 문제점:');

    // 이메일 불일치 체크
    if (orders) {
      const orderEmails = [...new Set(orders.map(o => o.customer_email))];
      const userEmails = users?.map(u => u.email) || [];

      const unmatchedOrderEmails = orderEmails.filter(email =>
        !userEmails.includes(email)
      );

      if (unmatchedOrderEmails.length > 0) {
        console.log('  ⚠️ 회원가입하지 않은 이메일로 주문이 있음:');
        unmatchedOrderEmails.forEach(email => {
          const count = orders.filter(o => o.customer_email === email).length;
          console.log(`    - ${email}: ${count}개 주문`);
        });
      }
    }

    console.log('\n해결 방안:');
    console.log('  1. 결제 시 로그인한 사용자의 이메일을 우선 사용');
    console.log('  2. PayApp에서 받은 이메일과 로그인 이메일이 다른 경우 로그인 이메일 사용');
    console.log('  3. 주문 저장 시 userInfo의 이메일을 customer_email로 저장');
    console.log('  4. 대시보드에서 조회 시 로그인한 사용자 이메일로 필터링');

    console.log('\n=== 분석 완료 ===');

  } catch (error) {
    console.error('❌ 분석 중 오류:', error);
  }
}

checkUsersAndOrders();