import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Image fields may hold one path or a list of paths (the CMS media picker allows multiple selection)
const images = z.union([z.string(), z.array(z.string())]).default([]);

const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), body: z.string() }),
  z.object({ type: z.literal('subheading'), text: z.string() }),
  z.object({ type: z.literal('quote'), text: z.string(), by: z.string().optional() }),
  z.object({
    type: z.literal('images'),
    layout: z.enum(['single', 'two', 'three', 'carousel']).default('single'),
    images,
    captions: z.string().optional(),
  }),
  z.object({ type: z.literal('stats'), items: z.array(z.object({ value: z.string(), label: z.string() })) }),
  z.object({ type: z.literal('colors'), items: z.array(z.object({ name: z.string(), hex: z.string() })) }),
  z.object({ type: z.literal('list'), items: z.array(z.string()) }),
]);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(99),
    tags: z.string(),
    summary: z.string(),
    cover: z.string(),
    heroTitle: z.string().optional(),
    lede: z.string().optional(),
    year: z.string().default('2025'),
    role: z.string().default('Product Designer'),
    scope: z.string().default('UX · UI'),
    type: z.string().default('Web'),
    client: z.string().default('Confidential'),
    sections: z.array(z.object({
      label: z.string(),
      heading: z.string(),
      blocks: z.array(block).default([]),
    })).default([]),
  }),
});

export const collections = { projects };
