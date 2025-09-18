// lib/notion.js
// Next.js 프로젝트에서 사용할 Notion API 연동 코드

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

// Notion 클라이언트 초기화
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

/**
 * 발행된 블로그 글 목록 가져오기
 */
export async function getPublishedPosts() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Published',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: 'PublishedDate',
          direction: 'descending',
        },
      ],
    });

    return response.results.map(page => ({
      id: page.id,
      title: page.properties.제목?.title[0]?.plain_text || 
             page.properties.Title?.title[0]?.plain_text || '',
      slug: page.properties.Slug?.rich_text[0]?.plain_text || '',
      category: page.properties.Category?.select?.name || '',
      tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      excerpt: page.properties.Excerpt?.rich_text[0]?.plain_text || '',
      publishedDate: page.properties.PublishedDate?.date?.start || '',
      thumbnail: page.properties.Thumbnail?.files[0]?.url || 
                page.properties.Thumbnail?.files[0]?.file?.url || '',
      author: page.properties.Author?.people[0]?.name || ''
    }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

/**
 * Slug로 특정 포스트 가져오기
 */
export async function getPostBySlug(slug) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Slug',
        rich_text: {
          equals: slug,
        },
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0];
    
    // 페이지 내용을 Markdown으로 변환
    const mdblocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdblocks);

    return {
      id: page.id,
      title: page.properties.제목?.title[0]?.plain_text || 
             page.properties.Title?.title[0]?.plain_text || '',
      slug: page.properties.Slug?.rich_text[0]?.plain_text || '',
      category: page.properties.Category?.select?.name || '',
      tags: page.properties.Tags?.multi_select?.map(tag => tag.name) || [],
      excerpt: page.properties.Excerpt?.rich_text[0]?.plain_text || '',
      publishedDate: page.properties.PublishedDate?.date?.start || '',
      thumbnail: page.properties.Thumbnail?.files[0]?.url || '',
      author: page.properties.Author?.people[0]?.name || '',
      content: mdString.parent,
    };
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return null;
  }
}

/**
 * 관련 포스트 가져오기 (같은 카테고리)
 */
export async function getRelatedPosts(category, currentId, limit = 2) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        and: [
          {
            property: 'Category',
            select: {
              equals: category,
            },
          },
          {
            property: 'Published',
            checkbox: {
              equals: true,
            },
          },
        ],
      },
      page_size: limit + 1, // 현재 글 제외용
    });

    return response.results
      .filter(page => page.id !== currentId)
      .slice(0, limit)
      .map(page => ({
        id: page.id,
        title: page.properties.제목?.title[0]?.plain_text || 
               page.properties.Title?.title[0]?.plain_text || '',
        slug: page.properties.Slug?.rich_text[0]?.plain_text || '',
        excerpt: page.properties.Excerpt?.rich_text[0]?.plain_text || '',
        thumbnail: page.properties.Thumbnail?.files[0]?.url || '',
        publishedDate: page.properties.PublishedDate?.date?.start || '',
      }));
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
}