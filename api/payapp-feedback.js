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

    // 결제 성공 (state 또는 pay_state === '4' 또는 4)
    const paymentState = pay_state || state;
    if (paymentState == 4 || paymentState == '4') {
      console.log('✅ 결제 성공 확인');

      // 여기서 데이터베이스에 저장해야 함
      // Supabase에 직접 저장
      try {
        const orderData = {
          order_number: orderid || mul_no || `PAYAPP-${Date.now()}`,
          customer_name: buyer || '미확인',
          customer_email: email || '',
          customer_phone: recvphone || '',
          business_name: goodname || '',  // goodname이 매장명
          package_name: memo || '미블 체험단',  // memo에 패키지 정보
          amount: parseInt(price) || 0,
          payment_method: pay_type || paytype || 'payapp',
          status: 'paid',
          receipt_url: csturl || receipturl || '',  // csturl 우선, 없으면 receipturl
          notes: `PayApp Feedback - ${new Date().toISOString()} | mul_no: ${mul_no} | csturl: ${csturl}`
        };

        console.log('Supabase에 저장할 데이터:', orderData);

        // Supabase API 호출
        const supabaseResponse = await fetch('https://mamahome-five.vercel.app/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });

        const result = await supabaseResponse.json();
        console.log('Supabase 저장 결과:', result);
      } catch (error) {
        console.error('Supabase 저장 실패:', error);
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