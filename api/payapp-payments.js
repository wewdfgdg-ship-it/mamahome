// Vercel Function - PayApp Payments 테이블 API
// /api/payapp-payments
// PayApp 전용 결제 정보 관리

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`PayApp Payments API - ${req.method} 요청`);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  try {
    switch (req.method) {
      case 'POST':
        // PayApp 결제 정보 저장
        const payappData = req.body;

        // 필수 필드 검증
        if (!payappData.mul_no) {
          return res.status(400).json({
            error: 'mul_no (PayApp 고유번호)는 필수입니다'
          });
        }

        console.log('PayApp 데이터 저장 시도:', payappData);

        // UPSERT 방식으로 저장 (중복 방지)
        const { data: insertData, error: insertError } = await supabase
          .from('payapp')
          .upsert({
            mul_no: payappData.mul_no,
            order_id: payappData.order_id || null,
            state: payappData.state || null,
            pay_state: payappData.pay_state || null,
            price: payappData.price || 0,
            goodname: payappData.goodname || null,
            buyer: payappData.buyer || null,
            recvphone: payappData.recvphone || null,
            email: payappData.email || null,
            memo: payappData.memo || null,
            receipt_url: payappData.receipt_url || null,
            payurl: payappData.payurl || null,
            pay_type: payappData.pay_type || null,
            pay_date: payappData.pay_date || null,
            card_name: payappData.card_name || null,
            payauthcode: payappData.payauthcode || null,
            var1: payappData.var1 || null,
            var2: payappData.var2 || null,
            raw_data: payappData.raw_data || null
          }, {
            onConflict: 'mul_no'  // mul_no 기준으로 중복 체크
          })
          .select()
          .single();

        if (insertError) {
          console.error('PayApp 데이터 저장 오류:', insertError);
          return res.status(500).json({
            error: 'PayApp 데이터 저장 실패',
            details: insertError.message
          });
        }

        console.log('✅ PayApp 데이터 저장 성공:', insertData);

        // 영수증 URL 로그
        if (insertData.receipt_url) {
          console.log('🎯 영수증 URL 저장됨:', insertData.receipt_url);
        }

        return res.status(200).json({
          success: true,
          data: insertData
        });

      case 'GET':
        // PayApp 결제 정보 조회
        const { mul_no, order_id } = req.query;

        let query = supabase
          .from('payapp')
          .select('*');

        if (mul_no) {
          query = query.eq('mul_no', mul_no);
        } else if (order_id) {
          query = query.eq('order_id', order_id);
        } else {
          // 최근 10개 조회
          query = query.order('created_at', { ascending: false }).limit(10);
        }

        const { data: selectData, error: selectError } = await query;

        if (selectError) {
          console.error('PayApp 데이터 조회 오류:', selectError);
          return res.status(500).json({
            error: 'PayApp 데이터 조회 실패',
            details: selectError.message
          });
        }

        return res.status(200).json({
          success: true,
          data: selectData
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
        return res.status(405).json({
          error: `Method ${req.method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('PayApp Payments API 오류:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}