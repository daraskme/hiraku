/**
 * GET /api/lessons.json
 *
 * オープンデータとして全教材の frontmatter サマリーを公開する。
 * 外部の研究者・教師ツール・LLM のコンテキスト埋め込みなどから
 * 自由に参照可能。
 *
 * フォーマット: { generatedAt, total, lessons: [...] }
 */
import { getCollection } from 'astro:content';

const COLLECTIONS = [
  'kokugo1', 'kokugo2', 'kokugo3', 'kokugo4', 'kokugo6',
  'chugaku1', 'chugaku2', 'chugaku3',
  'kotoko1', 'kotoko2', 'kotoko3',
  'kateika5', 'chugakurika1', 'chugakurika2',
  'chugakurekishi1', 'kotokoeigo1', 'koteoyaku1',
  'sansu5', 'chugakukomin3',
  'kotorekishi1', 'kotokokanbun1', 'kotosekaishi1',
];

export async function GET() {
  const lessons = [];
  for (const c of COLLECTIONS) {
    const items = await getCollection(c);
    for (const l of items) {
      lessons.push({
        collection: c,
        id: l.id,
        url: `/library/${c}/${l.id}`,
        title: l.data.title,
        author: l.data.author,
        author_dates: l.data.author_dates,
        original_year: l.data.original_year,
        era: l.data.era,
        school_stage: l.data.school_stage,
        grade: l.data.grade,
        subject: l.data.subject,
        domains: l.data.domains,
        classical: l.data.classical,
        estimated_minutes: l.data.estimated_minutes,
        description: l.data.description,
        keywords: l.data.keywords,
        curriculum_items: l.data.curriculum_items,
        jlpt: l.data.jlpt,
        kanji_level: l.data.kanji_level,
        vocab_level: l.data.vocab_level,
        reading_difficulty: l.data.reading_difficulty,
        license_editorial: l.data.license_editorial,
        license_original: l.data.license_original,
        source: l.data.source,
        author_wikidata: l.data.author_wikidata,
        has_illustrations: !!(l.data.illustrations && l.data.illustrations.length),
        has_teaching_notes: !!l.data.teaching_notes,
        has_glossary: !!(l.data.glossary && l.data.glossary.length),
        has_questions: !!(l.data.questions && l.data.questions.length),
      });
    }
  }
  // 学年・教科順
  lessons.sort((a, b) => {
    const sa = (a.school_stage || '') + (a.grade || 0).toString().padStart(2, '0') + (a.collection || '');
    const sb = (b.school_stage || '') + (b.grade || 0).toString().padStart(2, '0') + (b.collection || '');
    return sa.localeCompare(sb) || a.id.localeCompare(b.id);
  });

  const body = JSON.stringify({
    generatedAt: new Date().toISOString(),
    license: 'Editorial: CC BY 4.0 / Original texts: Public Domain',
    source: 'https://github.com/daraskme/hiraku',
    total: lessons.length,
    collections: COLLECTIONS,
    lessons,
  }, null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
