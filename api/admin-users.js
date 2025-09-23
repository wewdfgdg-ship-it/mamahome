// Admin용 사용자 목록 API (인증 간소화)
// /api/admin-users

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Password');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 간단한 Admin 비밀번호 검증
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword !== 'admin1234') {
    return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
  }

  try {
    if (!supabase) {
      console.log('Supabase not configured, returning test data');
      // 개발 환경용 테스트 데이터
      return res.status(200).json({
        success: true,
        users: [
          {
            id: '1',
            email: 'test@example.com',
            name: '테스트 사용자',
            phone: '010-1234-5678',
            business_name: '테스트 회사',
            business_number: '123-45-67890',
            created_at: '2024-01-01T00:00:00Z',
            last_login: '2024-12-20T00:00:00Z'
          }
        ],
        message: 'Test data (Supabase not configured)'
      });
    }

    console.log('Fetching users from Supabase...');

    // Supabase에서 모든 사용자 가져오기
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({
        error: '사용자 목록 조회 중 오류가 발생했습니다.',
        details: error.message
      });
    }

    console.log(`Found ${users ? users.length : 0} users`);

    // 민감한 정보 제거 후 반환
    const sanitizedUsers = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || user.full_name || '이름 없음',
      phone: user.phone || user.phone_number || '',
      business_name: user.business_name || user.company_name || '',
      business_number: user.business_number || user.business_registration_number || '',
      created_at: user.created_at,
      last_login: user.last_login || user.last_sign_in_at || null,
      updated_at: user.updated_at
    }));

    res.status(200).json({
      success: true,
      users: sanitizedUsers,
      total: sanitizedUsers.length
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    res.status(500).json({
      error: '사용자 목록 조회 중 오류가 발생했습니다.',
      message: error.message
    });
  }
}