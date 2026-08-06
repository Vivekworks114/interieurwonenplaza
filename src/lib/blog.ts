import { getCollection, type CollectionEntry } from 'astro:content'

/** Posts per page on /blog/ and /blogs/ */
export const BLOG_PAGE_SIZE = 12

/** Newest-first blog posts from the local content collection (filled by Payload sync). */
export async function getBlogPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog')
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}
