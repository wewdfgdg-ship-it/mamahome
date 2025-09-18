// Vercel Function - 사용자 관리 API
// /api/users

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const JWT_SECRET = process.env.JWT_SECRET || 'mrble-secret-key-2024';

// 인증 미들웨어
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 인증 확인
  const decoded = verifyToken(req.headers.authorization);
  if (!decoded) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const path = req.url.split('?')[0];
  const pathParts = path.split('/').filter(p => p);

  // /api/users/:id/orders 형태 처리
  if (pathParts.length === 4 && pathParts[3] === 'orders') {
    const userId = pathParts[2];
    return await getUserOrders(req, res, userId, decoded);
  }

  // /api/users/:id 형태 처리
  if (pathParts.length === 3) {
    const userId = pathParts[2];

    switch (req.method) {
      case 'GET':
        return await getUser(req, res, userId, decoded);
      case 'PUT':
        return await updateUser(req, res, userId, decoded);
      case 'DELETE':
        return await deleteUser(req, res, userId, decoded);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  }

  res.status(404).json({ error: 'Endpoint not found' });
}

// 사용자 정보 조회
async function getUser(req, res, userId, decoded) {
  // 본인 또는 관리자만 조회 가능
  if (decoded.userId !== userId && !decoded.isAdmin) {
    return res.status(403).json({ error: '권한이 없습니다.' });
  }

  try {
    if (!supabase) {
      // 개발 환경용 더미 응답
      return res.status(200).json({
        success: true,
        user: {
          id: userId,
          email: decoded.email,
          name: '테스트 사용자',
          phone: '010-1234-5678',
          businessName: '',
          businessNumber: '',
          createdAt: new Date().toISOString()
        }
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, business_name, business_number, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        businessName: user.business_name,
        businessNumber: user.business_number,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
  }
}

// 사용자 정보 수정
async function updateUser(req, res, userId, decoded) {
  // 본인만 수정 가능
  if (decoded.userId !== userId) {
    return res.status(403).json({ error: '본인 정보만 수정할 수 있습니다.' });
  }

  const { name, phone, businessName, businessNumber } = req.body;

  try {
    if (!supabase) {
      // 개발 환경용 더미 응답
      return res.status(200).json({
        success: true,
        message: '사용자 정보가 수정되었습니다. (개발 모드)',
        user: {
          id: userId,
          email: decoded.email,
          name: name || '테스트 사용자',
          phone: phone || '010-1234-5678',
          businessName: businessName || '',
          businessNumber: businessNumber || ''
        }
      });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (businessName !== undefined) updateData.business_name = businessName;
    if (businessNumber !== undefined) updateData.business_number = businessNumber;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: '사용자 정보 수정에 실패했습니다.' });
    }

    res.status(200).json({
      success: true,
      message: '사용자 정보가 수정되었습니다.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        businessName: updatedUser.business_name,
        businessNumber: updatedUser.business_number
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: '사용자 정보 수정 중 오류가 발생했습니다.' });
  }
}

// 회원 탈퇴
async function deleteUser(req, res, userId, decoded) {
  // 본인만 탈퇴 가능
  if (decoded.userId !== userId) {
    return res.status(403).json({ error: '본인 계정만 삭제할 수 있습니다.' });
  }

  try {
    if (!supabase) {
      // 개발 환경용 더미 응답
      return res.status(200).json({
        success: true,
        message: '회원 탈퇴가 완료되었습니다. (개발 모드)'
      });
    }

    // 사용자를 비활성화 (soft delete)
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ error: '회원 탈퇴 처리에 실패했습니다.' });
    }

    // 모든 세션 삭제
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    res.status(200).json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '회원 탈퇴 처리 중 오류가 발생했습니다.' });
  }
}

// 사용자 주문 내역 조회
async function getUserOrders(req, res, userId, decoded) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 본인만 조회 가능
  if (decoded.userId !== userId) {
    return res.status(403).json({ error: '본인의 주문 내역만 조회할 수 있습니다.' });
  }

  try {
    if (!supabase) {
      // 개발 환경용 더미 응답
      return res.status(200).json({
        success: true,
        orders: [
          {
            id: '1',
            orderNumber: 'ORD-TEST-001',
            packageName: '미블 체험단 10명',
            amount: 50000,
            status: 'completed',
            createdAt: new Date().toISOString()
          }
        ],
        total: 1
      });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get orders error:', error);
      return res.status(500).json({ error: '주문 조회에 실패했습니다.' });
    }

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      packageName: order.package_name,
      amount: order.amount,
      status: order.status,
      paymentMethod: order.payment_method,
      createdAt: order.created_at
    }));

    res.status(200).json({
      success: true,
      orders: formattedOrders,
      total: formattedOrders.length
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: '주문 조회 중 오류가 발생했습니다.' });
  }
}