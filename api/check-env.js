// Vercel Function - 환경 변수 확인용 (디버깅용)
// /api/check-env

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 환경 변수 상태 확인
  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development',
    supabase: {
      url_configured: !!process.env.SUPABASE_URL,
      anon_key_configured: !!process.env.SUPABASE_ANON_KEY,
      url_prefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
      key_prefix: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET'
    },
    notion: {
      api_key_configured: !!process.env.NOTION_API_KEY,
      database_id_configured: !!process.env.NOTION_DATABASE_ID
    },
    vercel: {
      url: process.env.VERCEL_URL || 'not in Vercel',
      region: process.env.VERCEL_REGION || 'unknown'
    }
  };

  console.log('Environment check requested:', envStatus);

  res.status(200).json(envStatus);
}