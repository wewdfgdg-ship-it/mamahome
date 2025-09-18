// 📦 Notion 페이지 직접 연동 서버
// 데이터베이스 없이 개별 페이지를 직접 가져옵니다

const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors());
app.use(express.json());

// Notion 클라이언트 초기화
const notion = new Client({
  auth: process.env.NOTION_API_KEY || 'YOUR_NOTION_API_KEY_HERE',
});

const n2m = new NotionToMarkdown({ notionClient: notion });

// 페이지 ID 매핑 (slug와 Notion 페이지 ID 연결)
const pageMapping = {
  'online-flyer': '468cd5538a1e47a995a397c73e2b6b12', // 체험단은 온라인전단지
  'what-is-experience': 'a156bfbe937f47a7a2bfb56be7b58046', // 체험단이란 무엇인가
  // 더 많은 페이지 추가 가능
};

// 1. 페이지 목록 API (하드코딩된 목록)
app.get('/api/posts', async (req, res) => {
  try {
    // 하드코딩된 포스트 목록 (실제로는 Notion에서 가져올 수도 있음)
    const posts = [
      {
        id: '1',
        slug: 'online-flyer',
        title: '체험단은 온라인전단지!!!',
        category: '체험단 팁',
        excerpt: '광고보다 믿음직한 직원 추천! 임플로이언서 전략으로 브랜드 성장법을 알려드립니다.',
        thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
        publishedDate: '2024-01-15'
      },
      {
        id: '2',
        slug: 'what-is-experience',
        title: '체험단이란 무엇인가?',
        category: '체험단 팁',
        excerpt: '최초 포지션, 새로운 카테고리, 체험단 전략으로 브랜드 1등 만들기!',
        thumbnail: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400',
        publishedDate: '2024-01-14'
      }
    ];

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. 특정 페이지 내용 API (페이지 ID로 직접 가져오기)
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const pageId = pageMapping[slug];
    
    if (!pageId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Page not found',
        message: `Slug "${slug}" not mapped to any Notion page` 
      });
    }

    console.log(`Fetching Notion page: ${pageId} for slug: ${slug}`);
    
    // 페이지 정보 가져오기
    const page = await notion.pages.retrieve({ page_id: pageId });
    
    // 페이지 내용(블록) 가져오기
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    // 블록을 HTML로 변환
    let content = '';
    for (const block of blocks.results) {
      content += await blockToHtml(block);
    }

    // 페이지 제목 추출
    let title = '제목 없음';
    if (page.properties?.title?.title?.[0]) {
      title = page.properties.title.title[0].plain_text;
    } else if (page.properties?.Name?.title?.[0]) {
      title = page.properties.Name.title[0].plain_text;
    } else {
      // properties에서 첫 번째 title 타입 찾기
      for (const prop in page.properties) {
        if (page.properties[prop].type === 'title' && page.properties[prop].title?.[0]) {
          title = page.properties[prop].title[0].plain_text;
          break;
        }
      }
    }

    const post = {
      id: pageId,
      slug: slug,
      title: title,
      content: content,
      rawBlocks: blocks.results // 디버깅용
    };

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.body || error
    });
  }
});

// Notion 블록을 HTML로 변환하는 헬퍼 함수
async function blockToHtml(block) {
  let html = '';
  
  switch (block.type) {
    case 'paragraph':
      const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
      html = `<p>${text}</p>\n`;
      break;
      
    case 'heading_1':
      const h1Text = block.heading_1.rich_text.map(t => t.plain_text).join('');
      html = `<h1>${h1Text}</h1>\n`;
      break;
      
    case 'heading_2':
      const h2Text = block.heading_2.rich_text.map(t => t.plain_text).join('');
      html = `<h2>${h2Text}</h2>\n`;
      break;
      
    case 'heading_3':
      const h3Text = block.heading_3.rich_text.map(t => t.plain_text).join('');
      html = `<h3>${h3Text}</h3>\n`;
      break;
      
    case 'bulleted_list_item':
      const bulletText = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');
      html = `<li>${bulletText}</li>\n`;
      break;
      
    case 'numbered_list_item':
      const numberText = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');
      html = `<li>${numberText}</li>\n`;
      break;
      
    case 'quote':
      const quoteText = block.quote.rich_text.map(t => t.plain_text).join('');
      html = `<blockquote>${quoteText}</blockquote>\n`;
      break;
      
    case 'code':
      const codeText = block.code.rich_text.map(t => t.plain_text).join('');
      html = `<pre><code class="language-${block.code.language}">${codeText}</code></pre>\n`;
      break;
      
    case 'image':
      const imageUrl = block.image.file?.url || block.image.external?.url;
      if (imageUrl) {
        html = `<img src="${imageUrl}" alt="Image" />\n`;
      }
      break;
      
    case 'divider':
      html = '<hr />\n';
      break;
      
    default:
      console.log('Unsupported block type:', block.type);
  }
  
  return html;
}

// 3. Notion 페이지 URL에서 ID 추출 헬퍼
app.get('/api/extract-page-id', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.json({ success: false, error: 'URL is required' });
  }
  
  // Notion URL 패턴: https://www.notion.so/username/Page-Title-468cd5538a1e47a995a397c73e2b6b12
  const match = url.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
  
  if (match) {
    const pageId = match[1].replace(/-/g, ''); // 하이픈 제거
    res.json({ success: true, pageId });
  } else {
    res.json({ success: false, error: 'Invalid Notion URL' });
  }
});

// 4. 정적 파일 제공
app.use(express.static('.'));

// 서버 시작
app.listen(PORT, () => {
  console.log(`
  ✨ Notion 페이지 서버가 시작되었습니다!
  
  🌐 http://localhost:${PORT}
  
  📝 API 엔드포인트:
  - GET /api/posts - 포스트 목록
  - GET /api/posts/:slug - 특정 페이지 내용
  - GET /api/extract-page-id?url=... - Notion URL에서 페이지 ID 추출
  
  📂 정적 파일:
  - http://localhost:${PORT}/pages/press.html
  - http://localhost:${PORT}/pages/blog-post.html
  
  📌 현재 연결된 페이지:
  - online-flyer → 468cd5538a1e47a995a397c73e2b6b12
  - what-is-experience → a156bfbe937f47a7a2bfb56be7b58046
  `);
});