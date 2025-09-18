// 📦 필요한 패키지 설치 명령어
// npm install @notionhq/client notion-to-md

const { Client } = require('@notionhq/client');

// ⚠️ 아래 값들을 본인 것으로 변경하세요!
const NOTION_API_KEY = 'secret_여기에_본인_API_KEY_입력';
const DATABASE_ID = '여기에_본인_DATABASE_ID_입력';

// Notion 클라이언트 초기화
const notion = new Client({
  auth: NOTION_API_KEY,
});

// 1. 연결 테스트
async function testConnection() {
  console.log('🔄 Notion API 연결 테스트 중...\n');
  
  try {
    const response = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });
    
    console.log('✅ 연결 성공!');
    console.log('📚 데이터베이스 이름:', response.title[0]?.plain_text || '제목 없음');
    console.log('🔗 Database ID:', DATABASE_ID);
    
    return true;
  } catch (error) {
    console.error('❌ 연결 실패!');
    console.error('에러 메시지:', error.message);
    console.log('\n💡 확인사항:');
    console.log('1. API Key가 올바른지 확인');
    console.log('2. Database ID가 올바른지 확인');
    console.log('3. Integration이 데이터베이스에 연결되었는지 확인');
    
    return false;
  }
}
// 2. 블로그 글 목록 가져오기
async function getBlogPosts() {
  console.log('\n📝 블로그 글 목록 가져오는 중...\n');
  
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Published',
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
    
    console.log(`✅ 총 ${response.results.length}개의 글을 찾았습니다!\n`);
    
    response.results.forEach((page, index) => {
      const title = page.properties.제목?.title[0]?.plain_text || 
                   page.properties.Title?.title[0]?.plain_text || 
                   '제목 없음';
      const category = page.properties.Category?.select?.name || '카테고리 없음';
      const published = page.properties.PublishedDate?.date?.start || '날짜 없음';
      
      console.log(`${index + 1}. ${title}`);
      console.log(`   카테고리: ${category}`);
      console.log(`   발행일: ${published}`);
      console.log(`   ID: ${page.id}\n`);
    });
    
    return response.results;
  } catch (error) {
    console.error('❌ 글 목록 가져오기 실패:', error.message);
    return [];
  }
}

// 3. 특정 페이지 내용 가져오기
async function getPageContent(pageId) {
  console.log('\n📖 페이지 내용 가져오는 중...\n');
  
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });
    
    console.log('✅ 블록 개수:', blocks.results.length);
    
    blocks.results.forEach(block => {
      if (block.type === 'paragraph') {
        const text = block.paragraph.rich_text
          .map(t => t.plain_text)
          .join('');
        if (text) console.log('📝', text);
      } else if (block.type === 'heading_1') {
        const text = block.heading_1.rich_text
          .map(t => t.plain_text)
          .join('');
        console.log('\n# ' + text);
      } else if (block.type === 'heading_2') {
        const text = block.heading_2.rich_text
          .map(t => t.plain_text)
          .join('');
        console.log('\n## ' + text);
      }
    });
    
    return blocks.results;
  } catch (error) {
    console.error('❌ 페이지 내용 가져오기 실패:', error.message);
    return [];
  }
}

// 실행 함수
async function main() {
  console.log('='.repeat(50));
  console.log('🚀 Notion API 테스트 시작');
  console.log('='.repeat(50));
  
  // 1. 연결 테스트
  const connected = await testConnection();
  
  if (connected) {
    // 2. 글 목록 가져오기
    const posts = await getBlogPosts();
    
    // 3. 첫 번째 글 내용 가져오기 (있을 경우)
    if (posts.length > 0) {
      await getPageContent(posts[0].id);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ 테스트 완료!');
  console.log('='.repeat(50));
}

// 실행
main();
