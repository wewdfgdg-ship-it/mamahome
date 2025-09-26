// PayApp Payments 테이블 조회 스크립트
const { createClient } = require('@supabase/supabase-js');

// 환경변수에서 가져오거나 config.js의 값 사용
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

console.log('=== PayApp Payments 테이블 상태 확인 ===');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음');

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPayAppPayments() {
  try {
    console.log('\n=== PayApp Payments 테이블 조회 ===');

    // PayApp 결제 데이터 조회 (최신 10개)
    const { data: payments, error: selectError } = await supabase
      .from('payapp_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (selectError) {
      console.error('❌ PayApp Payments 조회 실패:', selectError.message);
      return;
    }

    console.log(`✅ PayApp Payments 조회 성공! ${payments.length}개 결제 발견`);

    if (payments.length === 0) {
      console.log('📝 현재 저장된 PayApp 결제 데이터가 없습니다.');
      return;
    }

    console.log('\n=== PayApp 결제 데이터 분석 ===');

    payments.forEach((payment, index) => {
      console.log(`\n--- 결제 ${index + 1} ---`);
      console.log('PayApp ID (mul_no):', payment.mul_no);
      console.log('주문번호 (order_id):', payment.order_id || '❌ NULL');
      console.log('상품명 (goodname):', payment.goodname);
      console.log('전화번호 (recvphone):', payment.recvphone);
      console.log('결제상태 (state):', payment.state);
      console.log('결제상태2 (pay_state):', payment.pay_state);
      console.log('가격 (price):', payment.price);
      console.log('영수증 URL:', payment.receipt_url || '❌ 없음');

      // raw_data JSON 분석
      if (payment.raw_data) {
        console.log('Raw Data 존재:', '✅');
        try {
          const rawData = typeof payment.raw_data === 'string'
            ? JSON.parse(payment.raw_data)
            : payment.raw_data;

          console.log('Raw Data에서 orderid 확인:', rawData.orderid || '❌ 없음');

          // PayApp에서 보낸 모든 파라미터 표시
          console.log('PayApp에서 전송된 전체 파라미터:');
          Object.keys(rawData).forEach(key => {
            console.log(`  ${key}: ${rawData[key]}`);
          });

        } catch (e) {
          console.log('Raw Data 파싱 실패:', e.message);
        }
      } else {
        console.log('Raw Data:', '❌ 없음');
      }

      console.log('생성일시:', payment.created_at);
    });

    // order_id 필드 상태 요약
    console.log('\n=== order_id 필드 상태 요약 ===');
    const orderIdStats = {
      total: payments.length,
      withOrderId: payments.filter(p => p.order_id && p.order_id.trim() !== '').length,
      withoutOrderId: payments.filter(p => !p.order_id || p.order_id.trim() === '').length
    };

    console.log('전체 결제 건수:', orderIdStats.total);
    console.log('order_id가 있는 결제:', orderIdStats.withOrderId);
    console.log('order_id가 없는 결제:', orderIdStats.withoutOrderId);

    if (orderIdStats.withoutOrderId > 0) {
      console.log('⚠️  PayApp에서 orderid를 전송하지 않거나 저장 과정에서 누락됨');
    }

    // raw_data에서 orderid 확인
    console.log('\n=== Raw Data의 orderid 확인 ===');
    let rawDataWithOrderId = 0;
    let rawDataWithoutOrderId = 0;

    payments.forEach(payment => {
      if (payment.raw_data) {
        try {
          const rawData = typeof payment.raw_data === 'string'
            ? JSON.parse(payment.raw_data)
            : payment.raw_data;

          if (rawData.orderid && rawData.orderid.trim() !== '') {
            rawDataWithOrderId++;
          } else {
            rawDataWithoutOrderId++;
          }
        } catch (e) {
          rawDataWithoutOrderId++;
        }
      } else {
        rawDataWithoutOrderId++;
      }
    });

    console.log('Raw Data에 orderid가 있는 결제:', rawDataWithOrderId);
    console.log('Raw Data에 orderid가 없는 결제:', rawDataWithoutOrderId);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

checkPayAppPayments();