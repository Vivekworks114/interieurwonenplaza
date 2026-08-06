import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  // Payload sync may also emit heroImage, image, excerpt, slug, date, etc.
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().optional(),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      featuredImage: z.string().optional(),
      heroImage: z.string().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      excerpt: z.string().optional(),
      slug: z.string().optional(),
      date: z.coerce.date().optional(),
      useLiveHtml: z.boolean().optional(),
    })
    .passthrough(),
});

const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    featuredImage: z.string().optional(),
    pageType: z.enum(['product', 'page']).optional(),
  }),
});

export const collections = { blog, pages };
