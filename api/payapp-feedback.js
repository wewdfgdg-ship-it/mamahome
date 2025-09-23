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
      state,      // 결제 상태 (4: 입금완료)
      orderid,    // 주문번호
      goodname,   // 상품명
      price,      // 결제금액
      recvphone,  // 수신자 전화번호
      buyer,      // 구매자명
      email,      // 이메일
      memo,       // 메모
      var1,       // 추가 변수 1
      var2,       // 추가 변수 2
      receipturl, // 영수증 URL
      paytype,    // 결제수단
      paydate     // 결제일시
    } = params;

    console.log('결제 상태:', state);
    console.log('주문번호:', orderid);
    console.log('상품명:', goodname);
    console.log('금액:', price);
    console.log('영수증 URL:', receipturl);

    // 결제 성공 (state === '4' 또는 state === 4)
    if (state == 4 || state == '4') {
      console.log('✅ 결제 성공 확인');

      // 여기서 데이터베이스에 저장해야 함
      // Supabase에 직접 저장
      try {
        const orderData = {
          order_number: orderid,
          customer_name: buyer || '미확인',
          customer_email: email || '',
          customer_phone: recvphone || '',
          business_name: goodname || '',  // goodname이 매장명
          package_name: memo || '미블 체험단',  // memo에 패키지 정보
          amount: parseInt(price) || 0,
          payment_method: paytype || 'payapp',
          status: 'paid',
          receipt_url: receipturl || '',
          notes: `PayApp Feedback - ${new Date().toISOString()}`
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