/**
 * /api/ai-questions
 *
 * 教材本文を投げると、教師向けに新しい発問を 5 つ生成。
 *
 * POST { lessonContext, existingQuestions? }
 * → { questions: string[] }
 */
import { jsonResponse } from '../_lib/session';

interface Env {
  AI?: {
    run(model: string, input: Record<string, unknown>): Promise<{ response?: string }>;
  };
}

interface Body {
  lessonContext?: string;
  existingQuestions?: string[];
}

const MAX_CONTEXT = 4000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AI || typeof env.AI.run !== 'function') {
    return jsonResponse(
      { error: 'ai_not_configured' },
      { status: 503 }
    );
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return jsonResponse({ error: 'invalid_body' }, { status: 400 });
  }
  const ctx = (body.lessonContext || '').slice(0, MAX_CONTEXT);
  if (!ctx) return jsonResponse({ error: 'missing_context' }, { status: 400 });

  const existing = (body.existingQuestions || [])
    .filter((q): q is string => typeof q === 'string')
    .slice(0, 10)
    .map((q) => '・' + q.slice(0, 150))
    .join('\n');

  const systemPrompt =
    'あなたは日本の学校教師の補助 AI です。教材を読んで、生徒との対話を深めるための' +
    '「開かれた発問」(yes/no で答えられないもの) を作ります。発問は思考を促し、' +
    '複数の解釈を許容するものに。日本語の敬体で書いてください。';

  const userPrompt =
    '次の教材について、新しい発問を 5 つ作ってください。\n\n' +
    '【教材】\n' + ctx + '\n\n' +
    (existing ? '【既にある発問 (重複を避けてください)】\n' + existing + '\n\n' : '') +
    '【新しい発問 5 つ】(箇条書き「1. 」「2. 」… の形式で)';

  try {
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.8,
    });
    const text = (result && result.response) ? String(result.response) : '';
    if (!text) return jsonResponse({ error: 'empty_response' }, { status: 502 });

    // 「1. 」「2. 」… で分割して配列化
    const questions = text
      .split(/\n+/)
      .map((line) => line.replace(/^\s*[0-9]+[.、)]?\s*/, '').replace(/^[-*・]\s*/, '').trim())
      .filter((line) => line.length > 5 && line.length < 400)
      .slice(0, 5);

    if (questions.length === 0) {
      return jsonResponse({ raw: text, questions: [] });
    }
    return jsonResponse({ questions });
  } catch (e) {
    return jsonResponse({ error: 'ai_error', detail: String(e).slice(0, 200) }, { status: 502 });
  }
};
