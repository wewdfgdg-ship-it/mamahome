// Vercel Function - 주문 관리 API
// /api/orders

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// 디버깅 로그 추가
console.log('=== Supabase Environment Check ===');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_ANON_KEY exists:', !!supabaseKey);
if (supabaseUrl) {
  console.log('SUPABASE_URL starts with:', supabaseUrl.substring(0, 30) + '...');
}

// 한국 시간으로 변환하는 헬퍼 함수
function toKST(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  // UTC에서 KST로 변환 (UTC + 9시간)
  const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
  const kstDate = new Date(date.getTime() + kstOffset);

  // 한국 시간 형식으로 포맷 (YYYY-MM-DD HH:mm:ss)
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kstDate.getUTCDate()).padStart(2, '0');
  const hours = String(kstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(kstDate.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

let supabase = null;

if (supabaseUrl && supabaseKey) {
  console.log('Initializing Supabase client...');
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
  console.log('Supabase client initialized successfully');
} else {
  console.log('WARNING: Supabase not configured - environment variables missing');
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
  console.log('=== createOrder function called ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const orderData = req.body;

  // 유효성 검사 - 두 가지 형식 모두 지원
  const orderNumber = orderData.orderNumber || orderData.order_number;
  const customer = orderData.customer || {
    name: orderData.customer_name,
    email: orderData.customer_email,
    phone: orderData.customer_phone,
    businessName: orderData.business_name,
    businessNumber: orderData.business_number
  };
  const amount = orderData.amount || orderData.package_price;

  if (!orderNumber || (!customer && !orderData.customer_name) || !amount) {
    console.log('Validation failed - missing fields:');
    console.log('orderNumber:', !!orderNumber);
    console.log('customer:', !!customer);
    console.log('customer_name:', !!orderData.customer_name);
    console.log('amount:', !!amount);
    console.log('Full request body:', JSON.stringify(orderData, null, 2));
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // UTF-8 문자열 확인 함수
  const ensureUTF8 = (str) => {
    if (!str) return null;
    // 문자열이 이미 UTF-8인 경우 그대로 반환
    return String(str);
  };

  // 주문 데이터 구성 (UTF-8 인코딩 보장) - 두 가지 형식 모두 지원
  const newOrder = {
    order_number: ensureUTF8(orderNumber),
    customer_name: ensureUTF8(customer?.name || orderData.customer_name) || '고객',
    customer_email: ensureUTF8(customer?.email || orderData.customer_email) || '',
    customer_phone: ensureUTF8(customer?.phone || orderData.customer_phone) || '',
    business_name: ensureUTF8(customer?.businessName || orderData.business_name),
    business_number: ensureUTF8(customer?.businessNumber || orderData.business_number),
    package_name: ensureUTF8(orderData.packageInfo?.name || orderData.package_name || orderData.goodname) || '미블 체험단',
    package_price: orderData.packageInfo?.price || orderData.package_price || orderData.price || amount,
    amount: amount,
    payment_method: ensureUTF8(orderData.paymentMethod || orderData.payment_method) || 'payapp',
    status: ensureUTF8(orderData.status) || 'paid',
    notes: ensureUTF8(orderData.notes)
  };

  console.log('Prepared order data for DB:', JSON.stringify(newOrder, null, 2));

  // Supabase에 저장
  if (supabase) {
    console.log('Attempting to save to Supabase...');
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select();

      if (error) {
        console.error('Supabase INSERT error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({
          error: error.message,
          details: error.details || 'No additional details',
          hint: error.hint || 'No hint available'
        });
      }

      console.log('Order saved successfully:', data);
      return res.status(201).json({
        success: true,
        order: data[0],
        message: '주문이 성공적으로 저장되었습니다.'
      });
    } catch (err) {
      console.error('Database exception:', err);
      console.error('Exception details:', JSON.stringify(err, null, 2));
      return res.status(500).json({
        error: 'Database error',
        details: err.message
      });
    }
  } else {
    // Supabase 연결 안됨 (로컬 테스트용)
    console.log('WARNING: Supabase not connected - returning mock response');
    res.status(201).json({
      success: true,
      order: { ...newOrder, id: Date.now() },
      message: '주문이 임시 저장되었습니다 (DB 연결 안됨).',
      warning: 'Database not connected - this is a mock response'
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