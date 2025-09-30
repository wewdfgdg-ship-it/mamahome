// Vercel Function - 이미지 업로드 API
// /api/upload-image

import { createClient } from '@supabase/supabase-js';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL || 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
  api: {
    bodyParser: false, // formidable이 파싱하도록 비활성화
  },
};

// 관리자 인증 체크
function checkAdminAuth(req) {
  const authHeader = req.headers.authorization;
  return authHeader && authHeader.includes('admin');
}

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 관리자 권한 체크
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
  }

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file) {
      return res.status(400).json({ error: '이미지 파일이 없습니다.' });
    }

    // 파일 읽기
    const fileBuffer = await fs.readFile(file.filepath || file.path);

    // 파일 확장자 추출
    const fileExt = path.extname(file.originalFilename || file.name || 'image.jpg');

    // 유니크한 파일명 생성
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = `package-images/${fileName}`;

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Supabase 업로드 오류:', error);

      // 버킷이 없으면 생성 시도
      if (error.message && (error.message.includes('Bucket not found') || error.message.includes('not found'))) {
        console.log('버킷이 없습니다. 생성을 시도합니다...');

        const { data: createData, error: createError } = await supabase.storage.createBucket('images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
          console.error('버킷 생성 실패:', createError);
          // 이미 존재하는 경우 무시하고 계속 진행
          if (!createError.message.includes('already exists')) {
            return res.status(500).json({
              error: '이미지 저장소를 생성할 수 없습니다.',
              details: createError.message
            });
          }
        }

        // 다시 업로드 시도
        const { data: retryData, error: retryError } = await supabase.storage
          .from('images')
          .upload(filePath, fileBuffer, {
            contentType: file.mimetype || 'image/jpeg',
            upsert: false
          });

        if (retryError) {
          return res.status(500).json({
            error: '이미지 업로드에 실패했습니다.',
            details: retryError.message
          });
        }
      } else {
        return res.status(500).json({
          error: '이미지 업로드에 실패했습니다.',
          details: error.message
        });
      }
    }

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // 임시 파일 삭제
    if (file.filepath) {
      try {
        await fs.unlink(file.filepath);
      } catch (err) {
        // 파일 삭제 실패는 무시
        console.error('임시 파일 삭제 실패:', err);
      }
    }

    return res.status(200).json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      path: filePath
    });

  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return res.status(500).json({
      error: '이미지 업로드 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}