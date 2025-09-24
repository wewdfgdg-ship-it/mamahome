// Vercel Function - PayApp API 프록시
// /api/payapp-proxy

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // PayApp API로 전달할 파라미터
    const params = req.body;

    // FormData 생성
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }

    // PayApp API 호출
    const payappResponse = await fetch('https://api.payapp.kr/oapi/apiLoad.html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const responseText = await payappResponse.text();

    // PayApp 응답 로깅 (디버깅용)
    console.log('=== PayApp API 응답 ===');
    console.log('응답 텍스트:', responseText);

    // 응답이 JSON인지 확인
    try {
      const jsonResponse = JSON.parse(responseText);

      // JSON 응답 상세 로깅
      console.log('JSON 파싱 성공:', jsonResponse);
      if (jsonResponse.CSTURL) {
        console.log('🎯 CSTURL 발견:', jsonResponse.CSTURL);
      }
      if (jsonResponse.csturl) {
        console.log('🎯 csturl 발견:', jsonResponse.csturl);
      }
      if (jsonResponse.payurl) {
        console.log('📍 payurl:', jsonResponse.payurl);
      }

      return res.status(200).json(jsonResponse);
    } catch (e) {
      // JSON이 아니면 텍스트로 반환
      console.log('JSON 파싱 실패, 텍스트로 반환');
      return res.status(200).send(responseText);
    }

  } catch (error) {
    console.error('PayApp proxy error:', error);
    return res.status(500).json({
      error: 'Failed to process payment',
      message: error.message
    });
  }
}