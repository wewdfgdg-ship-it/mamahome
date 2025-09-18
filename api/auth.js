// Vercel Function - 사용자 인증 API
// /api/auth

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// JWT 비밀키
const JWT_SECRET = process.env.JWT_SECRET || 'mrble-secret-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mrble-refresh-secret-2024';

// JWT 토큰 생성
function generateTokens(userId, email) {
  const accessToken = jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
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

  // POST 요청의 경우 body에서 action 읽기
  if (req.method === 'POST') {
    const { action } = req.body || {};

    try {
      switch (action) {
        case 'register':
          return await handleRegister(req, res);

        case 'login':
          return await handleLogin(req, res);

        case 'verify':
          return await handleVerify(req, res);

        case 'refresh':
          return await handleRefresh(req, res);

        case 'logout':
          return await handleLogout(req, res);

        case 'health':
          return res.status(200).json({ status: 'ok', supabase: !!supabase });

        default:
          res.status(404).json({ error: 'Action not found', receivedAction: action });
      }
    } catch (error) {
      console.error('Auth API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET 요청의 경우
  if (req.method === 'GET') {
    try {
      const path = req.url.split('?')[0];
      const endpoint = path.split('/').pop();

      if (endpoint === 'me') {
        return await handleGetMe(req, res);
      }

      res.status(404).json({ error: 'Endpoint not found' });
    } catch (error) {
      console.error('Auth API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// 회원가입
async function handleRegister(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, phone, businessName, businessNumber } = req.body;

  // 유효성 검사
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });
  }

  // 이메일 형식 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '올바른 이메일 형식이 아닙니다.' });
  }

  // 비밀번호 길이 검사
  if (password.length < 6) {
    return res.status(400).json({ error: '비밀번호는 6자 이상이어야 합니다.' });
  }

  try {
    // Supabase 연결 확인
    if (!supabase) {
      // 개발 환경용 더미 응답
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = 'dev-' + Date.now();
      const { accessToken, refreshToken } = generateTokens(userId, email);

      return res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다. (개발 모드)',
        user: {
          id: userId,
          email,
          name: name || '',
          phone: phone || '',
          businessName: businessName || '',
          businessNumber: businessNumber || ''
        },
        accessToken,
        refreshToken
      });
    }

    // 이메일 중복 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: '이미 사용중인 이메일입니다.' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: hashedPassword,
        name: name || null,
        phone: phone || null,
        business_name: businessName || null,
        business_number: businessNumber || null,
        created_at: new Date().toISOString(),
        is_active: true,
        email_verified: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error('User creation error:', insertError);
      return res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
    }

    // JWT 토큰 생성
    const { accessToken, refreshToken } = generateTokens(newUser.id, email);

    // 세션 저장
    await supabase
      .from('user_sessions')
      .insert([{
        user_id: newUser.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        businessName: newUser.business_name,
        businessNumber: newUser.business_number
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '회원가입 처리 중 오류가 발생했습니다.' });
  }
}

// 로그인
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    // Supabase 연결 확인
    if (!supabase) {
      // 개발 환경용 테스트 계정
      if (email === 'test@mrble.com' && password === 'password123') {
        const userId = 'dev-test-user';
        const { accessToken, refreshToken } = generateTokens(userId, email);

        return res.status(200).json({
          success: true,
          message: '로그인 성공 (개발 모드)',
          user: {
            id: userId,
            email,
            name: '테스트 사용자',
            phone: '010-1234-5678'
          },
          accessToken,
          refreshToken
        });
      } else {
        return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      }
    }

    // 사용자 조회
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 계정 활성화 확인
    if (!user.is_active) {
      return res.status(403).json({ error: '비활성화된 계정입니다.' });
    }

    // 비밀번호 검증
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 마지막 로그인 시간 업데이트
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // JWT 토큰 생성
    const { accessToken, refreshToken } = generateTokens(user.id, email);

    // 세션 저장
    await supabase
      .from('user_sessions')
      .insert([{
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        businessName: user.business_name,
        businessNumber: user.business_number
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 처리 중 오류가 발생했습니다.' });
  }
}

// 토큰 검증
async function handleVerify(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.body.token;

  if (!token) {
    return res.status(401).json({ error: '토큰이 없습니다.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    res.status(200).json({
      success: true,
      valid: true,
      userId: decoded.userId,
      email: decoded.email
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

// 토큰 갱신
async function handleRefresh(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token이 없습니다.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // 새로운 토큰 생성
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(decoded.userId, decoded.email);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    return res.status(401).json({ error: '유효하지 않은 refresh token입니다.' });
  }
}

// 현재 사용자 정보 조회
async function handleGetMe(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!supabase) {
      // 개발 환경용 더미 응답
      return res.status(200).json({
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: '테스트 사용자'
        }
      });
    }

    // 사용자 정보 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, business_name, business_number, created_at')
      .eq('id', decoded.userId)
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
        createdAt: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    return res.status(401).json({ error: '인증에 실패했습니다.' });
  }
}

// 로그아웃
async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refreshToken } = req.body;

  if (refreshToken && supabase) {
    try {
      // 세션 삭제
      await supabase
        .from('user_sessions')
        .delete()
        .eq('token', refreshToken);
    } catch (error) {
      console.error('Session deletion error:', error);
    }
  }

  res.status(200).json({
    success: true,
    message: '로그아웃되었습니다.'
  });
}