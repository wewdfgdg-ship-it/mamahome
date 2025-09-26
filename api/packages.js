import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 라우팅: URL 경로에 따라 다른 동작 수행
  const { action, id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          // 패키지 상세 조회
          return await getPackageDetail(req, res, id);
        } else {
          // 패키지 목록 조회
          return await getPackagesList(req, res);
        }

      case 'POST':
        // 관리자 인증 체크
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }
        // 패키지 생성
        return await createPackage(req, res);

      case 'PUT':
        // 관리자 인증 체크
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }
        // 패키지 수정
        return await updatePackage(req, res, id);

      case 'DELETE':
        // 관리자 인증 체크
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }
        // 패키지 삭제
        return await deletePackage(req, res, id);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('서버 오류:', error);
    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
}

// 관리자 인증 체크 함수
function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.includes('admin');
}

// 패키지 목록 조회
async function getPackagesList(req, res) {
  const { category, active } = req.query;

  let query = supabase.from('packages').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  if (active === 'true') {
    query = query.eq('is_active', true);
  }

  query = query.order('sort_order', { ascending: true });

  const { data: packages, error } = await query;

  if (error) {
    console.error('패키지 조회 오류:', error);
    return res.status(500).json({
      success: false,
      error: '패키지를 불러오는데 실패했습니다.'
    });
  }

  return res.status(200).json({
    success: true,
    data: packages || [],
    count: packages?.length || 0
  });
}

// 패키지 상세 조회
async function getPackageDetail(req, res, id) {
  if (!id) {
    return res.status(400).json({
      success: false,
      error: '패키지 ID가 필요합니다.'
    });
  }

  const { data: package_detail, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('패키지 상세 조회 오류:', error);
    return res.status(500).json({
      success: false,
      error: '패키지 정보를 불러오는데 실패했습니다.'
    });
  }

  if (!package_detail) {
    return res.status(404).json({
      success: false,
      error: '해당 패키지를 찾을 수 없습니다.'
    });
  }

  return res.status(200).json({
    success: true,
    data: package_detail
  });
}

// 패키지 생성
async function createPackage(req, res) {
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

  if (!name || !category || !pricing_options) {
    return res.status(400).json({
      success: false,
      error: '필수 정보가 부족합니다.'
    });
  }

  const newPackage = {
    name,
    category,
    pricing_options,
    thumbnail_url,
    detail_images: detail_images || [],
    short_description,
    full_description,
    features: features || [],
    is_active: is_active !== undefined ? is_active : true,
    sort_order: sort_order || 0
  };

  const { data: createdPackage, error } = await supabase
    .from('packages')
    .insert([newPackage])
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
    data: createdPackage,
    message: '패키지가 성공적으로 생성되었습니다.'
  });
}

// 패키지 수정
async function updatePackage(req, res, id) {
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
}

// 패키지 삭제
async function deletePackage(req, res, id) {
  if (!id) {
    return res.status(400).json({
      success: false,
      error: '패키지 ID가 필요합니다.'
    });
  }

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('패키지 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      error: '패키지 삭제에 실패했습니다.'
    });
  }

  return res.status(200).json({
    success: true,
    message: '패키지가 성공적으로 삭제되었습니다.'
  });
}