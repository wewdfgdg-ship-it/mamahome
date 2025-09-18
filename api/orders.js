// Vercel Function - 주문 관리 API
// /api/orders

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 한국 시간으로 변환하는 헬퍼 함수
function toKST(date) {
  const kstDate = new Date(date);
  kstDate.setHours(kstDate.getHours() + 9); // UTC + 9 = KST
  return kstDate.toISOString();
}

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }
  });
}

export default async function handler(req, res) {
  // CORS 헤더 설정 - UTF-8 인코딩 포함
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  try {
    switch (method) {
      case 'POST':
        // 새 주문 생성
        return await createOrder(req, res);

      case 'GET':
        // 주문 조회
        return await getOrders(req, res);

      case 'PUT':
        // 주문 상태 업데이트
        return await updateOrder(req, res);

      case 'DELETE':
        // 주문 삭제
        return await deleteOrder(req, res);

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 주문 생성
async function createOrder(req, res) {
  const orderData = req.body;

  // 유효성 검사
  if (!orderData.orderNumber || !orderData.customer || !orderData.amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // UTF-8 문자열 확인 함수
  const ensureUTF8 = (str) => {
    if (!str) return null;
    // 문자열이 이미 UTF-8인 경우 그대로 반환
    return String(str);
  };

  // 주문 데이터 구성 (UTF-8 인코딩 보장)
  const newOrder = {
    order_number: ensureUTF8(orderData.orderNumber),
    customer_name: ensureUTF8(orderData.customer?.name) || '고객',
    customer_email: ensureUTF8(orderData.customer?.email) || '',
    customer_phone: ensureUTF8(orderData.customer?.phone) || '',
    business_name: ensureUTF8(orderData.customer?.businessName),
    business_number: ensureUTF8(orderData.customer?.businessNumber),
    package_name: ensureUTF8(orderData.packageInfo?.name || orderData.goodname) || '미블 체험단',
    package_price: orderData.packageInfo?.price || orderData.price || orderData.amount,
    amount: orderData.amount,
    payment_method: ensureUTF8(orderData.paymentMethod) || 'payapp',
    status: ensureUTF8(orderData.status) || 'pending',
    notes: ensureUTF8(orderData.notes)
  };

  // Supabase에 저장
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({
        success: true,
        order: data[0],
        message: '주문이 성공적으로 저장되었습니다.'
      });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    // Supabase 연결 안됨 (로컬 테스트용)
    res.status(201).json({
      success: true,
      order: { ...newOrder, id: Date.now() },
      message: '주문이 임시 저장되었습니다 (DB 연결 안됨).'
    });
  }
}

// 주문 조회
async function getOrders(req, res) {
  const { orderNumber, status, limit = 50 } = req.query;

  if (supabase) {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // 필터링 추가
      if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: error.message });
      }

      // 시간을 한국 시간으로 표시 (표시용)
      const ordersWithKST = (data || []).map(order => ({
        ...order,
        created_at_kst: order.created_at ? toKST(order.created_at) : null,
        updated_at_kst: order.updated_at ? toKST(order.updated_at) : null
      }));

      return res.status(200).json({
        success: true,
        orders: ordersWithKST,
        total: ordersWithKST.length
      });
    } catch (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  } else {
    // Supabase 연결 안됨 (더미 데이터)
    const dummyOrders = [
      {
        id: '1',
        order_number: 'ORD-20241216-001',
        customer_name: '홍길동',
        customer_email: 'hong@example.com',
        customer_phone: '010-1234-5678',
        package_name: 'Premium',
        amount: 50000,
        status: 'completed',
        created_at: '2024-12-16T10:00:00Z'
      }
    ];

    res.status(200).json({
      success: true,
      orders: dummyOrders,
      total: dummyOrders.length
    });
  }
}

// 주문 업데이트
async function updateOrder(req, res) {
  const { orderId } = req.query;
  const updates = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  // Supabase에서 업데이트
  if (supabase) {
    try {
      // UTF-8 문자열 확인 함수
      const ensureUTF8 = (str) => {
        if (!str) return null;
        return String(str);
      };

      // 업데이트 데이터 준비
      const updateData = {};
      if (updates.order_number !== undefined) updateData.order_number = ensureUTF8(updates.order_number);
      if (updates.customer_name !== undefined) updateData.customer_name = ensureUTF8(updates.customer_name);
      if (updates.customer_email !== undefined) updateData.customer_email = ensureUTF8(updates.customer_email);
      if (updates.customer_phone !== undefined) updateData.customer_phone = ensureUTF8(updates.customer_phone);
      if (updates.business_name !== undefined) updateData.business_name = ensureUTF8(updates.business_name);
      if (updates.business_number !== undefined) updateData.business_number = ensureUTF8(updates.business_number);
      if (updates.package_name !== undefined) updateData.package_name = ensureUTF8(updates.package_name);
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.status !== undefined) updateData.status = ensureUTF8(updates.status);
      if (updates.notes !== undefined) updateData.notes = ensureUTF8(updates.notes);

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Supabase update error:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: '주문이 업데이트되었습니다.',
        orderId,
        updates: updateData
      });
    } catch (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: '주문 업데이트 실패' });
    }
  }

  // Supabase 없는 경우 테스트 응답
  res.status(200).json({
    success: true,
    message: '주문이 업데이트되었습니다.',
    orderId,
    updates
  });
}

// 주문 삭제
async function deleteOrder(req, res) {
  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  // Supabase에서 삭제
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        console.error('Supabase delete error:', error);
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        message: '주문이 삭제되었습니다.',
        orderId
      });
    } catch (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: '주문 삭제 실패' });
    }
  }

  // Supabase 없는 경우 테스트 응답
  res.status(200).json({
    success: true,
    message: '주문이 삭제되었습니다.',
    orderId
  });
}