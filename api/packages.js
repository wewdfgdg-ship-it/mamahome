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

  // 관리자 인증 체크
  const isAdmin = checkAdminAuth(req);

  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, id);

      case 'POST':
        if (!isAdmin) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }
        return await handlePost(req, res);

      case 'PUT':
        if (!isAdmin) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }
        return await handlePut(req, res, id);

      case 'DELETE':
        if (!isAdmin) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }
        return await handleDelete(req, res, id);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}

// 관리자 인증 체크
function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.includes('admin');
}

// GET: 패키지 목록 조회
async function handleGet(req, res, id) {
  if (id) {
    // 단일 패키지 조회
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, error: '패키지를 찾을 수 없습니다.' });
    }

    return res.status(200).json({ success: true, data });
  }

  // 패키지 목록 조회
  const { category, active } = req.query;
  let query = supabase.from('packages').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  if (active === 'true') {
    query = query.eq('is_active', true);
  }

  query = query.order('sort_order', { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    data: data || [],
    count: data?.length || 0
  });
}

// POST: 새 패키지 생성
async function handlePost(req, res) {
  const packageData = {
    name: req.body.name,
    category: req.body.category,
    thumbnail_url: req.body.thumbnail_url || '',
    short_description: req.body.short_description || '',
    full_description: req.body.full_description || '',
    detail_images: req.body.detail_images || [],
    pricing_options: req.body.pricing_options || [],
    features: req.body.features || [],
    is_active: req.body.is_active !== false,
    sort_order: req.body.sort_order || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('packages')
    .insert([packageData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return res.status(201).json({
    success: true,
    data,
    message: '패키지가 성공적으로 생성되었습니다.'
  });
}

// PUT: 패키지 수정
async function handlePut(req, res, id) {
  if (!id) {
    return res.status(400).json({ success: false, error: '패키지 ID가 필요합니다.' });
  }

  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // id와 created_at은 수정하지 않음
  delete updateData.id;
  delete updateData.created_at;

  const { data, error } = await supabase
    .from('packages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    data,
    message: '패키지가 성공적으로 수정되었습니다.'
  });
}

// DELETE: 패키지 삭제
async function handleDelete(req, res, id) {
  if (!id) {
    return res.status(400).json({ success: false, error: '패키지 ID가 필요합니다.' });
  }

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: '패키지가 성공적으로 삭제되었습니다.'
  });
}