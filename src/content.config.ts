import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const lessonSchema = z.object({
  title: z.string(),
  author: z.string(),
  author_dates: z.string().optional(),
  original_year: z.number().int().optional(),
  era: z.string().optional(),
  source: z.object({
    text: z.string(),
    url: z.string().url().optional(),
    base: z.string().optional(),
  }),
  school_stage: z.enum(['shogaku', 'chugaku', 'kotoko']).default('shogaku'),
  grade: z.number().int().min(1).max(9),
  subject: z.string(),
  domains: z.array(z.string()).default([]),
  classical: z.boolean().default(false),
  curriculum_items: z
    .array(
      z.object({
        code: z.string(),
        label: z.string(),
      })
    )
    .default([]),
  estimated_minutes: z.number().int().optional(),
  order: z.number().int().default(0),
  description: z.string(),
  keywords: z.array(z.string()).default([]),
  license_editorial: z.string().default('CC-BY-4.0'),
  license_original: z.string().default('PublicDomain'),
  goals: z.array(z.string()).default([]),
  glossary: z
    .array(
      z.object({
        term: z.string(),
        meaning: z.string(),
      })
    )
    .default([]),
  questions: z.array(z.string()).default([]),
});

const kokugo3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo3' }),
  schema: lessonSchema,
});

const chugaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugaku1' }),
  schema: lessonSchema,
});

const kotoko1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotoko1' }),
  schema: lessonSchema,
});

const chugakurika1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakurika1' }),
  schema: lessonSchema,
});

const kotokoeigo1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotokoeigo1' }),
  schema: lessonSchema,
});

const sansu5 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sansu5' }),
  schema: lessonSchema,
});

export const collections = { kokugo3, chugaku1, kotoko1, chugakurika1, kotokoeigo1, sansu5 };
