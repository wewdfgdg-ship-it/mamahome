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
  const { action, id, category_id, package_id } = req.query;

  // action 파라미터로 API 라우팅
  if (action === 'categories') {
    return await handleCategories(req, res, id);
  } else if (action === 'thumbnails') {
    return await handleThumbnails(req, res, id, category_id);
  } else if (action === 'detail-pages') {
    return await handleDetailPages(req, res, id, req.query.thumbnail_id);
  } else if (action === 'prices') {
    return await handlePrices(req, res, id, category_id);
  }

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

// ==================== 카테고리 관련 함수들 ====================
async function handleCategories(req, res, id) {
  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        } else {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return res.status(200).json({ success: true, data: data || [] });
        }

      case 'POST':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        // Slug 중복 체크
        if (req.body.slug) {
          const { data: existingCategories, error: checkError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', req.body.slug);

          // 오류가 없고 이미 존재하는 카테고리가 있는 경우
          if (!checkError && existingCategories && existingCategories.length > 0) {
            return res.status(400).json({
              success: false,
              error: `'${req.body.slug}' slug는 이미 사용 중입니다. 다른 값을 입력해주세요.`
            });
          }
        }

        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert([req.body])
          .select()
          .single();

        if (createError) {
          console.error('카테고리 생성 오류:', createError);
          if (createError.message.includes('duplicate key value') || createError.message.includes('unique constraint')) {
            return res.status(400).json({
              success: false,
              error: 'Slug 값이 중복되었습니다. 다른 값을 입력해주세요.'
            });
          }
          return res.status(500).json({
            success: false,
            error: createError.message || '카테고리 생성에 실패했습니다.'
          });
        }
        return res.status(201).json({ success: true, data: newCategory });

      case 'PUT':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        console.log('PUT request - ID from params:', id);
        console.log('PUT request - Body:', req.body);

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        // 먼저 현재 카테고리 정보를 가져옴
        const { data: currentCategory, error: getCurrentError } = await supabase
          .from('categories')
          .select('slug')
          .eq('id', id)
          .single();

        if (getCurrentError || !currentCategory) {
          console.error('현재 카테고리를 찾을 수 없습니다:', getCurrentError);
          return res.status(404).json({
            success: false,
            error: '해당 카테고리를 찾을 수 없습니다.'
          });
        }

        console.log('Current category slug:', currentCategory.slug);
        console.log('New slug:', req.body.slug);

        // Slug가 변경되었을 때만 중복 체크
        if (req.body.slug && req.body.slug !== currentCategory.slug) {
          console.log(`Slug changed from '${currentCategory.slug}' to '${req.body.slug}' - checking for duplicates`);

          const { data: existingCategories, error: checkError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', req.body.slug);

          console.log('Existing categories with same slug:', existingCategories);

          // 오류가 없고 다른 카테고리가 이미 해당 slug를 사용 중인 경우
          if (!checkError && existingCategories && existingCategories.length > 0) {
            console.log('Slug is already in use by another category');
            return res.status(400).json({
              success: false,
              error: `'${req.body.slug}' slug는 이미 사용 중입니다. 다른 값을 입력해주세요.`
            });
          }
        } else {
          console.log('Slug unchanged, skipping duplicate check');
        }

        const { data: updatedCategory, error: updateError } = await supabase
          .from('categories')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('카테고리 수정 오류:', updateError);
          if (updateError.message.includes('duplicate key value') || updateError.message.includes('unique constraint')) {
            return res.status(400).json({
              success: false,
              error: 'Slug 값이 중복되었습니다. 다른 값을 입력해주세요.'
            });
          }
          return res.status(500).json({
            success: false,
            error: updateError.message || '카테고리 수정에 실패했습니다.'
          });
        }
        return res.status(200).json({ success: true, data: updatedCategory });

      case 'DELETE':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: '카테고리가 삭제되었습니다.' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('카테고리 API 오류:', error);

    // 데이터베이스 제약 조건 오류 처리
    if (error.message && (error.message.includes('duplicate') || error.message.includes('unique'))) {
      return res.status(400).json({
        success: false,
        error: 'Slug 값이 중복되었습니다. 다른 값을 입력해주세요.'
      });
    }

    // 기타 데이터베이스 오류
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({
        success: false,
        error: 'Slug 값이 중복되었습니다. 다른 값을 입력해주세요.'
      });
    }

    return res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
}

// ==================== 썸네일 관련 함수들 ====================
async function handleThumbnails(req, res, id, category_id) {
  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('thumbnails')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        } else if (category_id) {
          const { data, error } = await supabase
            .from('thumbnails')
            .select('*')
            .eq('category_id', category_id)
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return res.status(200).json({ success: true, data: data || [] });
        } else {
          const { data, error } = await supabase
            .from('thumbnails')
            .select('*')
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return res.status(200).json({ success: true, data: data || [] });
        }

      case 'POST':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        console.log('썸네일 생성 요청 데이터:', req.body);

        const { data: newThumbnail, error: createError } = await supabase
          .from('thumbnails')
          .insert([req.body])
          .select()
          .single();

        if (createError) {
          console.error('썸네일 생성 오류 상세:', createError);
          throw createError;
        }
        return res.status(201).json({ success: true, data: newThumbnail });

      case 'PUT':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { data: updatedThumbnail, error: updateError } = await supabase
          .from('thumbnails')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedThumbnail });

      case 'DELETE':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('thumbnails')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: '썸네일이 삭제되었습니다.' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('썸네일 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}

// ==================== 상세페이지 관련 함수들 ====================
async function handleDetailPages(req, res, id, thumbnail_id) {
  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('detail_pages')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        } else if (thumbnail_id) {
          const { data, error } = await supabase
            .from('detail_pages')
            .select('*')
            .eq('thumbnail_id', thumbnail_id)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        } else {
          const { data, error } = await supabase
            .from('detail_pages')
            .select('*');

          if (error) throw error;
          return res.status(200).json({ success: true, data: data || [] });
        }

      case 'POST':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        const { data: newDetailPage, error: createError } = await supabase
          .from('detail_pages')
          .insert([req.body])
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json({ success: true, data: newDetailPage });

      case 'PUT':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { data: updatedDetailPage, error: updateError } = await supabase
          .from('detail_pages')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedDetailPage });

      case 'DELETE':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('detail_pages')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: '상세페이지가 삭제되었습니다.' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('상세페이지 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}

// ==================== 가격 옵션 관련 함수들 ====================
async function handlePrices(req, res, id, category_id) {
  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          const { data, error } = await supabase
            .from('package_prices')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        } else if (category_id) {
          const { data, error } = await supabase
            .from('package_prices')
            .select('*')
            .eq('category_id', category_id)
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return res.status(200).json({ success: true, data: data || [] });
        } else {
          const { data, error } = await supabase
            .from('package_prices')
            .select('*')
            .order('sort_order', { ascending: true });

          if (error) throw error;
          return res.status(200).json({ success: true, data: data || [] });
        }

      case 'POST':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        const { data: newPrice, error: createError } = await supabase
          .from('package_prices')
          .insert([req.body])
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json({ success: true, data: newPrice });

      case 'PUT':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { data: updatedPrice, error: updateError } = await supabase
          .from('package_prices')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedPrice });

      case 'DELETE':
        if (!checkAdminAuth(req)) {
          return res.status(401).json({ success: false, error: '관리자 권한이 필요합니다.' });
        }

        if (!id) {
          return res.status(400).json({ success: false, error: 'ID가 필요합니다.' });
        }

        const { error: deleteError } = await supabase
          .from('package_prices')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: '가격 옵션이 삭제되었습니다.' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('가격 옵션 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '서버 오류가 발생했습니다.'
    });
  }
}