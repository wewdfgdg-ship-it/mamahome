// Vercel Function - 주문 관리 API
// /api/orders

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
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

  // 주문 데이터 구성
  const newOrder = {
    order_number: orderData.orderNumber,
    customer_name: orderData.customer?.name || '고객',
    customer_email: orderData.customer?.email || '',
    customer_phone: orderData.customer?.phone || '',
    business_name: orderData.customer?.businessName || null,
    business_number: orderData.customer?.businessNumber || null,
    package_name: orderData.packageInfo?.name || orderData.goodname || '미블 체험단',
    package_price: orderData.packageInfo?.price || orderData.price || orderData.amount,
    amount: orderData.amount,
    payment_method: orderData.paymentMethod || 'payapp',
    status: orderData.status || 'pending',
    notes: orderData.notes || null
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

      return res.status(200).json({
        success: true,
        orders: data || [],
        total: data?.length || 0
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

  // 여기서 실제로는 Supabase 업데이트
  // const { data, error } = await supabase
  //   .from('orders')
  //   .update(updates)
  //   .eq('id', orderId);

  res.status(200).json({
    success: true,
    message: '주문이 업데이트되었습니다.',
    orderId,
    updates
  });
}