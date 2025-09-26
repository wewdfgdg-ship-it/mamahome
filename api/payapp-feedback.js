// Vercel Function - PayApp 결제 결과 Feedback 수신
// /api/payapp-feedback
// PayApp에서 결제 완료 시 서버로 직접 호출하는 API

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('=== PayApp Feedback 수신 ===');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  console.log('Body:', req.body);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // PayApp은 GET 또는 POST로 결과를 전송할 수 있음
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // PayApp에서 전송하는 파라미터
    // GET 방식일 경우 query에서, POST 방식일 경우 body에서 가져옴
    const params = req.method === 'GET' ? req.query : req.body;

    const {
      state,      // 결제 상태 (구형)
      pay_state,  // 결제 상태 (신형 - 4: 입금완료)
      orderid,    // 주문번호
      mul_no,     // 결제 요청번호 (PayApp 문서 기준)
      goodname,   // 상품명
      price,      // 결제금액
      recvphone,  // 수신자 전화번호
      buyer,      // 구매자명
      email,      // 이메일
      memo,       // 메모
      var1,       // 추가 변수 1
      var2,       // 추가 변수 2
      receipturl, // 영수증 URL (구형 파라미터)
      csturl,     // 영수증 URL (신형 파라미터 - PayApp 문서 기준)
      payurl,     // 결제 페이지 URL
      pay_type,   // 결제수단 (1=카드, 2=휴대폰 등)
      paytype,    // 결제수단 (구형)
      pay_date,   // 결제일시 (신형)
      paydate,    // 결제일시 (구형)
      card_name,  // 카드사명
      payauthcode // 승인번호
    } = params;

    // 모든 파라미터 로깅 (디버깅용)
    console.log('전체 파라미터:', params);
    console.log('결제 상태 (state):', state);
    console.log('결제 상태 (pay_state):', pay_state);
    console.log('주문번호:', orderid || mul_no);
    console.log('상품명:', goodname);
    console.log('금액:', price);
    console.log('영수증 URL (receipturl):', receipturl);
    console.log('영수증 URL (csturl):', csturl);
    console.log('결제 페이지 URL (payurl):', payurl);
    console.log('결제수단:', pay_type || paytype);

    // 결제 상태 확인 - PayApp은 state='1'이 성공
    console.log('Payment State Check:', { state, pay_state });

    // PayApp 결제 성공: state='1' (구형) 또는 pay_state='4' (신형)
    if (state == '1' || state == 1 || pay_state == '4' || pay_state == 4) {
      console.log('✅ 결제 성공 확인');

      // PayApp 전용 테이블에 저장
      try {
        // 전화번호 포맷팅 함수
        function formatPhoneNumber(phone) {
          if (!phone) return '';

          // 숫자만 추출
          const numbers = phone.replace(/[^0-9]/g, '');

          // 11자리 휴대폰 번호 (010-xxxx-xxxx)
          if (numbers.length === 11 && numbers.startsWith('010')) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
          }
          // 10자리 휴대폰 번호 (011, 016, 017, 018, 019 등)
          else if (numbers.length === 10 && (numbers.startsWith('011') || numbers.startsWith('016') ||
                   numbers.startsWith('017') || numbers.startsWith('018') || numbers.startsWith('019'))) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
          }
          // 서울 지역번호 (02-xxxx-xxxx)
          else if (numbers.length === 10 && numbers.startsWith('02')) {
            return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
          }
          // 그 외 지역번호 (031, 032 등)
          else if (numbers.length === 11 && !numbers.startsWith('010')) {
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
          }
          // 기타 경우 원본 반환
          return phone;
        }

        // PayApp 전용 데이터 구성
        const payappData = {
          mul_no: mul_no || `PAYAPP-${Date.now()}`,  // PayApp 고유번호
          order_id: orderid || '',
          state: state || '',
          pay_state: pay_state || '',
          price: parseInt(price) || 0,
          goodname: goodname || '',
          buyer: buyer || '',
          recvphone: formatPhoneNumber(recvphone),  // 전화번호 포맷팅 적용
          email: email || '',
          memo: memo || '',
          receipt_url: csturl || receipturl || '',  // 영수증 URL (중요!)
          payurl: payurl || '',
          pay_type: pay_type || paytype || '',
          pay_date: pay_date || paydate || '',
          card_name: card_name || '',
          payauthcode: payauthcode || '',
          var1: var1 || '',
          var2: var2 || '',
          raw_data: params  // 전체 원본 데이터 저장
        };

        console.log('PayApp 테이블에 저장할 데이터:', payappData);

        // Supabase PayApp 테이블에 저장
        const supabaseResponse = await fetch('https://mamahome-five.vercel.app/api/payapp-payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payappData)
        });

        const result = await supabaseResponse.json();
        console.log('PayApp 테이블 저장 결과:', result);

        // 영수증 URL 확인 로그
        if (payappData.receipt_url) {
          console.log('🎯 영수증 URL 저장 성공:', payappData.receipt_url);
        } else {
          console.warn('⚠️ 영수증 URL이 없습니다');
        }

      } catch (error) {
        console.error('PayApp 테이블 저장 실패:', error);
      }

      // PayApp에 성공 응답 반환 (중요!)
      // PayApp은 "SUCCESS" 문자열을 받아야 정상 처리로 인식
      return res.status(200).send('SUCCESS');
    } else {
      console.log('⚠️ 결제 실패 또는 대기 중:', state);
      // 실패 응답
      return res.status(200).send('FAIL');
    }
  } catch (error) {
    console.error('Feedback 처리 오류:', error);
    return res.status(500).send('ERROR');
  }
}