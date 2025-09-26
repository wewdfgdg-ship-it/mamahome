import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: '패키지 ID가 필요합니다.'
      });
    }

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

    // 업데이트할 데이터 준비
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (pricing_options !== undefined) updateData.pricing_options = pricing_options;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
    if (detail_images !== undefined) updateData.detail_images = detail_images;
    if (short_description !== undefined) updateData.short_description = short_description;
    if (full_description !== undefined) updateData.full_description = full_description;
    if (features !== undefined) updateData.features = features;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    // 패키지 업데이트
    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('패키지 수정 오류:', error);
      return res.status(500).json({
        success: false,
        error: '패키지 수정에 실패했습니다.'
      });
    }

    if (!updatedPackage) {
      return res.status(404).json({
        success: false,
        error: '해당 패키지를 찾을 수 없습니다.'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedPackage,
      message: '패키지가 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}