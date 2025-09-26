import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 쿼리 파라미터 처리
    const { active, category } = req.query;

    let query = supabase
      .from('packages')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 활성 상태 필터링
    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    // 카테고리 필터링
    if (category) {
      query = query.eq('category', category);
    }

    const { data: packages, error } = await query;

    if (error) {
      console.error('패키지 목록 조회 오류:', error);
      return res.status(500).json({
        success: false,
        error: '패키지 목록을 불러오는데 실패했습니다.'
      });
    }

    return res.status(200).json({
      success: true,
      data: packages || [],
      count: packages?.length || 0
    });

  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}