import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 관리자 인증 체크
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.includes('admin')) {
    return res.status(401).json({
      success: false,
      error: '관리자 권한이 필요합니다.'
    });
  }

  try {
    const {
      name,
      category,
      pricing_options,
      thumbnail_url,
      detail_images,
      short_description,
      full_description,
      features,
      is_active,
      sort_order
    } = req.body;

    // 필수 필드 검증
    if (!name || !category || !pricing_options) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다.'
      });
    }

    // 패키지 생성
    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert([{
        name,
        category,
        pricing_options: pricing_options || [],
        thumbnail_url: thumbnail_url || '',
        detail_images: detail_images || [],
        short_description: short_description || '',
        full_description: full_description || '',
        features: features || [],
        is_active: is_active !== false,
        sort_order: sort_order || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('패키지 생성 오류:', error);
      return res.status(500).json({
        success: false,
        error: '패키지 생성에 실패했습니다.'
      });
    }

    return res.status(201).json({
      success: true,
      data: newPackage,
      message: '패키지가 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}