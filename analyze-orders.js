// 주문 데이터 분석 스크립트 - 한글 인코딩 및 전화번호 문제 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function analyzeOrders() {
  try {
    console.log('=== Orders 테이블 데이터 분석 ===\n');

    // 1. 테이블 스키마 정보 (가능한 범위에서)
    console.log('1. 최근 10개 주문 상세 데이터 조회');
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 주문 조회 실패:', error.message);
      return;
    }

    console.log(`✅ ${orders.length}개 주문 발견\n`);

    // 2. 한글 데이터 상태 분석
    console.log('2. 한글 데이터 상태 분석');
    console.log('='.repeat(50));

    orders.forEach((order, index) => {
      console.log(`\n주문 #${index + 1}: ${order.order_number}`);
      console.log(`생성일시: ${new Date(order.created_at).toLocaleString('ko-KR')}`);

      // 한글 데이터 필드들 확인
      const koreanFields = ['customer_name', 'business_name', 'package_name', 'notes'];
      koreanFields.forEach(field => {
        if (order[field]) {
          const value = order[field];
          const isKorean = /[가-힣]/.test(value);
          const isMojibake = value.includes('??') || value.includes('ï¿½') || value.includes('?');

          console.log(`  ${field}: "${value}"`);
          console.log(`    - 한글 포함: ${isKorean ? '✅' : '❌'}`);
          console.log(`    - 깨짐 의심: ${isMojibake ? '⚠️' : '✅'}`);
          console.log(`    - 바이트 길이: ${Buffer.byteLength(value, 'utf8')}`);
          console.log(`    - 문자 길이: ${value.length}`);

          // UTF-8 인코딩 상태 확인
          try {
            const encoded = Buffer.from(value, 'utf8');
            const decoded = encoded.toString('utf8');
            console.log(`    - UTF-8 인코딩 일치: ${value === decoded ? '✅' : '❌'}`);
          } catch (e) {
            console.log(`    - UTF-8 인코딩 오류: ❌`);
          }
        }
      });

      // 3. 전화번호 분석
      if (order.customer_phone) {
        console.log(`  전화번호: "${order.customer_phone}"`);
        const isDefault = order.customer_phone === '010-1234-5678';
        const isValidFormat = /^010-\d{4}-\d{4}$/.test(order.customer_phone);
        const isRealNumber = !isDefault && isValidFormat;

        console.log(`    - 기본값(010-1234-5678): ${isDefault ? '⚠️' : '✅'}`);
        console.log(`    - 올바른 형식: ${isValidFormat ? '✅' : '❌'}`);
        console.log(`    - 실제 번호로 추정: ${isRealNumber ? '✅' : '❌'}`);
      }

      console.log(`  상태: ${order.status}`);
      console.log(`  결제방법: ${order.payment_method || 'N/A'}`);
      console.log(`  금액: ${order.amount ? order.amount.toLocaleString() : 'N/A'}원`);
    });

    // 4. 전화번호 패턴 통계
    console.log('\n\n3. 전화번호 패턴 통계');
    console.log('='.repeat(50));

    const phoneStats = {
      total: 0,
      default: 0,
      valid: 0,
      real: 0,
      empty: 0
    };

    const phonePatterns = {};

    orders.forEach(order => {
      if (order.customer_phone) {
        phoneStats.total++;

        if (order.customer_phone === '010-1234-5678') {
          phoneStats.default++;
        } else if (/^010-\d{4}-\d{4}$/.test(order.customer_phone)) {
          phoneStats.valid++;
          phoneStats.real++;
        } else {
          phoneStats.valid++; // 다른 형식이라도 내용이 있으면 유효로 간주
        }

        // 패턴 분석
        const pattern = order.customer_phone;
        phonePatterns[pattern] = (phonePatterns[pattern] || 0) + 1;
      } else {
        phoneStats.empty++;
      }
    });

    console.log(`총 주문 수: ${orders.length}개`);
    console.log(`전화번호 입력된 주문: ${phoneStats.total}개`);
    console.log(`기본값(010-1234-5678) 사용: ${phoneStats.default}개 (${((phoneStats.default/phoneStats.total)*100).toFixed(1)}%)`);
    console.log(`실제 번호로 추정: ${phoneStats.real}개 (${((phoneStats.real/phoneStats.total)*100).toFixed(1)}%)`);
    console.log(`빈 값: ${phoneStats.empty}개`);

    console.log('\n전화번호 패턴별 분포:');
    Object.entries(phonePatterns)
      .sort(([,a], [,b]) => b - a)
      .forEach(([pattern, count]) => {
        console.log(`  "${pattern}": ${count}회`);
      });

    // 5. 한글 데이터 통계
    console.log('\n\n4. 한글 데이터 통계');
    console.log('='.repeat(50));

    const koreanStats = {
      customer_name: { total: 0, korean: 0, broken: 0 },
      business_name: { total: 0, korean: 0, broken: 0 },
      package_name: { total: 0, korean: 0, broken: 0 },
      notes: { total: 0, korean: 0, broken: 0 }
    };

    orders.forEach(order => {
      Object.keys(koreanStats).forEach(field => {
        if (order[field]) {
          koreanStats[field].total++;
          if (/[가-힣]/.test(order[field])) {
            koreanStats[field].korean++;
          }
          if (order[field].includes('??') || order[field].includes('ï¿½')) {
            koreanStats[field].broken++;
          }
        }
      });
    });

    Object.entries(koreanStats).forEach(([field, stats]) => {
      if (stats.total > 0) {
        console.log(`${field}:`);
        console.log(`  데이터 있음: ${stats.total}개`);
        console.log(`  한글 포함: ${stats.korean}개 (${((stats.korean/stats.total)*100).toFixed(1)}%)`);
        console.log(`  깨짐 의심: ${stats.broken}개 (${((stats.broken/stats.total)*100).toFixed(1)}%)`);
      }
    });

    // 6. 특정 문제 케이스 확인
    console.log('\n\n5. 문제 케이스 상세 분석');
    console.log('='.repeat(50));

    const problemCases = orders.filter(order => {
      const hasDefaultPhone = order.customer_phone === '010-1234-5678';
      const hasBrokenKorean = ['customer_name', 'business_name', 'package_name', 'notes']
        .some(field => order[field] && (order[field].includes('??') || order[field].includes('ï¿½')));

      return hasDefaultPhone || hasBrokenKorean;
    });

    console.log(`문제 케이스 발견: ${problemCases.length}개`);

    problemCases.forEach((order, index) => {
      console.log(`\n문제 케이스 #${index + 1}: ${order.order_number}`);
      if (order.customer_phone === '010-1234-5678') {
        console.log(`  ⚠️ 기본 전화번호 사용`);
      }

      ['customer_name', 'business_name', 'package_name', 'notes'].forEach(field => {
        if (order[field] && (order[field].includes('??') || order[field].includes('ï¿½'))) {
          console.log(`  ⚠️ ${field} 한글 깨짐: "${order[field]}"`);
        }
      });
    });

  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error);
  }
}

analyzeOrders();