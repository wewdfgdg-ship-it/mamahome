const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Notion 클라이언트 초기화
const notion = new Client({
    auth: process.env.NOTION_API_KEY // Notion Integration Token
});

// 데이터베이스 ID (채널 연습 내부의 Blog Database)
const DATABASE_ID = '26cbdffa-378b-80b2-a2c7-ce91a1126bd7';

// CORS 설정 - 로컬 HTML에서 접근 가능하도록
app.use(cors());
app.use(express.json());

// Notion 콘텐츠를 HTML로 변환하는 함수
function notionBlocksToHtml(blocks) {
    let html = '';
    
    blocks.forEach(block => {
        switch(block.type) {
            case 'paragraph':
                const text = block.paragraph.rich_text.map(t => t.plain_text).join('');
                if (text.startsWith('##')) {
                    html += `<h2>${text.replace(/^##\s*/, '')}</h2>`;
                } else {
                    html += `<p>${text}</p>`;
                }
                break;
            case 'bulleted_list_item':
                html += `<li>${block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')}</li>`;
                break;
            case 'numbered_list_item':
                html += `<li>${block.numbered_list_item.rich_text.map(t => t.plain_text).join('')}</li>`;
                break;
            case 'heading_1':
                html += `<h1>${block.heading_1.rich_text.map(t => t.plain_text).join('')}</h1>`;
                break;
            case 'heading_2':
                html += `<h2>${block.heading_2.rich_text.map(t => t.plain_text).join('')}</h2>`;
                break;
            case 'heading_3':
                html += `<h3>${block.heading_3.rich_text.map(t => t.plain_text).join('')}</h3>`;
                break;            default:
                console.log('Unhandled block type:', block.type);
        }
    });
    
    // 리스트 태그 감싸기
    html = html.replace(/(<li>.*?<\/li>)+/gs, (match) => {
        return `<ul>${match}</ul>`;
    });
    
    return html;
}

// 모든 포스트 가져오기
app.get('/api/posts', async (req, res) => {
    try {
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: 'Published ',
                checkbox: {
                    equals: true
                }
            },
            sorts: [
                {
                    property: 'PublishedDate',
                    direction: 'descending'
                }
            ]
        });
        
        const posts = response.results.map(page => ({
            id: page.id,
            title: page.properties['이름']?.title[0]?.plain_text || '',
            slug: page.properties['Slug']?.rich_text[0]?.plain_text || '',
            category: page.properties['Category ']?.select?.name || '',
            excerpt: page.properties['Excerpt ']?.rich_text[0]?.plain_text || '',
            tags: page.properties['Tags ']?.rich_text[0]?.plain_text || '',
            published: page.properties['Published ']?.checkbox || false,
            publishedDate: page.properties['PublishedDate']?.date?.start || null
        }));
        
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// 특정 포스트 가져오기 (slug로)
app.get('/api/posts/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        // 임시 테스트 데이터 (Notion 연결 문제 해결 전까지)
        if (slug === 'what-is-experience-group') {
            return res.json({
                success: true,
                post: {
                    title: '체험단이란 무엇인가?',
                    slug: 'what-is-experience-group',
                    category: '체험단팁',
                    excerpt: '체험단은 기업의 제품이나 서비스를 무료로 체험하고 솔직한 리뷰를 작성하는 마케팅 활동입니다.',
                    tags: '체험단, 초보자가이드, 마케팅, 블로그',
                    published: true,
                    publishedDate: '2025-09-12',
                    content: `
                        <h2>🎯 체험단의 핵심 개념</h2>
                        <ul>
                            <li>기업: 제품/서비스를 무료로 제공</li>
                            <li>체험단원: 사용 후 리뷰 작성 (블로그, SNS 등)</li>
                            <li>Win-Win: 기업은 홍보 효과, 체험단원은 무료 체험</li>
                        </ul>
                        <h2>💡 체험단의 장점</h2>
                        <ul>
                            <li>무료로 다양한 제품/서비스 체험 가능</li>
                            <li>블로그 콘텐츠 소재 확보</li>
                            <li>리뷰 작성 능력 향상</li>
                            <li>인플루언서로 성장 기회</li>
                        </ul>
                        <h2>📝 체험단 신청 방법</h2>
                        <ol>
                            <li>체험단 모집 공고 확인 (네이버, 인스타그램 등)</li>
                            <li>신청 조건 확인 (블로그 방문자 수, 포스팅 수 등)</li>
                            <li>신청서 작성 (개인정보, 블로그 주소, 신청 동기)</li>
                            <li>선정 발표 대기</li>
                            <li>선정 시 제품 수령 후 리뷰 작성</li>
                        </ol>
                    `
                }
            });
        }
        
        // 원래 Notion API 코드
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: 'Slug',
                rich_text: {
                    equals: slug
                }
            }
        });
        
        if (response.results.length === 0) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        const page = response.results[0];
        
        // 페이지 내용 가져오기
        const blocks = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 100
        });
        
        // 블록을 HTML로 변환
        const content = notionBlocksToHtml(blocks.results);
        
        const post = {
            id: page.id,
            title: page.properties['이름']?.title[0]?.plain_text || '',
            slug: page.properties['Slug']?.rich_text[0]?.plain_text || '',
            category: page.properties['Category ']?.select?.name || '',
            excerpt: page.properties['Excerpt ']?.rich_text[0]?.plain_text || '',
            tags: page.properties['Tags ']?.rich_text[0]?.plain_text || '',
            published: page.properties['Published ']?.checkbox || false,
            publishedDate: page.properties['PublishedDate']?.date?.start || null,
            content: content
        };
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 헬스 체크
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 Notion Database ID: ${DATABASE_ID}`);
    console.log(`✅ API Endpoints:`);
    console.log(`   - GET /api/posts - 모든 포스트 가져오기`);
    console.log(`   - GET /api/posts/:slug - 특정 포스트 가져오기`);
});