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
  // 学習者向けの難易度メタ。すべて任意。
  // jlpt: 日本語能力試験 N1〜N5。N5 が初級、N1 が最上級。
  // kanji_level: 文部科学省「学年別漢字配当表」基準の最上学年 (1〜10、10 は中高常用漢字以上)
  // vocab_level: 「初級／中級／上級」あるいはおおよその語彙数感
  // reading_difficulty: 全体の読みやすさを5段階で (1=非常に易しい … 5=非常に難しい)
  jlpt: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']).optional(),
  kanji_level: z.number().int().min(1).max(10).optional(),
  vocab_level: z.enum(['初級', '中級', '上級']).optional(),
  reading_difficulty: z.number().int().min(1).max(5).optional(),
  // 著者 Wikidata Q番号 (例: 'Q19185' = 夏目漱石)。著者ページから外部情報を引く
  author_wikidata: z.string().regex(/^Q[0-9]+$/).optional(),
  // やさしい日本語版 (小学生にも分かる平易な文体への書き換え)
  // 設定があれば、教材ページに「やさしい日本語版」トグルが出る
  easy_japanese: z.string().optional(),
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

const kokugo1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo1' }),
  schema: lessonSchema,
});

const kokugo2 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo2' }),
  schema: lessonSchema,
});

const kokugo3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kokugo3' }),
  schema: lessonSchema,
});

const kotoko3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotoko3' }),
  schema: lessonSchema,
});

const koteoyaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/koteoyaku1' }),
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

const chugakurika2 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakurika2' }),
  schema: lessonSchema,
});

const kotokokanbun1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotokokanbun1' }),
  schema: lessonSchema,
});

const chugakurekishi1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakurekishi1' }),
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

const kotorekishi1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotorekishi1' }),
  schema: lessonSchema,
});

const kotosekaishi1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kotosekaishi1' }),
  schema: lessonSchema,
});

const chugakusugaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakusugaku1' }),
  schema: lessonSchema,
});

const sansu4 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sansu4' }),
  schema: lessonSchema,
});

const ongaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ongaku1' }),
  schema: lessonSchema,
});

const chugakusugaku2 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakusugaku2' }),
  schema: lessonSchema,
});

const chugakusugaku3 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chugakusugaku3' }),
  schema: lessonSchema,
});

const seibutsu1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/seibutsu1' }),
  schema: lessonSchema,
});

const kagaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/kagaku1' }),
  schema: lessonSchema,
});

const butsuri1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/butsuri1' }),
  schema: lessonSchema,
});

const chigaku1 = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chigaku1' }),
  schema: lessonSchema,
});

export const collections = { kokugo1, kokugo2, kokugo3, kokugo4, kokugo6, chugaku1, chugaku2, chugaku3, kotoko1, kotoko2, kotoko3, kateika5, chugakurika1, chugakurika2, chugakurekishi1, kotokoeigo1, koteoyaku1, kotokokanbun1, sansu5, chugakukomin3, kotorekishi1, kotosekaishi1, chugakusugaku1, sansu4, ongaku1, chugakusugaku2, chugakusugaku3, seibutsu1, kagaku1, butsuri1, chigaku1 };
