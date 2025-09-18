// Vercel Function - 관리자 인증 API
// /api/admin-auth

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, password, token } = req.body;

  // 환경 변수에서 관리자 비밀번호 가져오기 (없으면 기본값 사용)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

  try {
    switch (action) {
      case 'login':
        // 로그인 처리
        if (password === ADMIN_PASSWORD) {
          // 토큰 생성
          const newToken = 'admin-token-' + Buffer.from(Date.now() + '-mrble').toString('base64');

          return res.status(200).json({
            success: true,
            token: newToken,
            message: '로그인 성공'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: '비밀번호가 올바르지 않습니다.'
          });
        }

      case 'verify':
        // 토큰 검증
        if (token && (token.startsWith('admin-token-') || token.startsWith('dev-token-'))) {
          // 간단한 토큰 검증 (실제로는 JWT 등을 사용해야 함)
          return res.status(200).json({
            valid: true,
            message: '유효한 토큰입니다.'
          });
        } else {
          return res.status(401).json({
            valid: false,
            message: '유효하지 않은 토큰입니다.'
          });
        }

      case 'logout':
        // 로그아웃 처리 (서버 측에서는 특별히 할 일 없음)
        return res.status(200).json({
          success: true,
          message: '로그아웃되었습니다.'
        });

      default:
        return res.status(400).json({
          error: 'Invalid action'
        });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}