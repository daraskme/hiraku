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
  cover_image: z.string().optional(),
  illustrations: z
    .array(
      z.object({
        src: z.string(),
        caption: z.string().optional(),
        alt: z.string().optional(),
      })
    )
    .default([]),
  teaching_notes: z
    .object({
      overview: z.string().optional(),
      target_time: z.string().optional(),
      objectives: z.array(z.string()).default([]),
      flow: z
        .array(
          z.object({
            time: z.string().optional(),
            activity: z.string(),
          })
        )
        .default([]),
      discussion: z.array(z.string()).default([]),
      extensions: z.array(z.string()).default([]),
      materials: z.array(z.string()).default([]),
    })
    .optional(),
});

const kokugo3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo3' }),
  schema: lessonSchema,
});

const kokugo4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo4' }),
  schema: lessonSchema,
});

const kokugo6 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo6' }),
  schema: lessonSchema,
});

const chugaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugaku1' }),
  schema: lessonSchema,
});

const chugaku2 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugaku2' }),
  schema: lessonSchema,
});

const chugaku3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugaku3' }),
  schema: lessonSchema,
});

const kotoko1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotoko1' }),
  schema: lessonSchema,
});

const kotoko2 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotoko2' }),
  schema: lessonSchema,
});

const kateika5 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kateika5' }),
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

const chugakukomin3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakukomin3' }),
  schema: lessonSchema,
});

export const collections = { kokugo3, kokugo4, kokugo6, chugaku1, chugaku2, chugaku3, kotoko1, kotoko2, kateika5, chugakurika1, kotokoeigo1, sansu5, chugakukomin3 };
