/**
 * /api/ai-tutor
 *
 * Cloudflare Workers AI (binding: env.AI) を使って、教材の文脈つきで
 * ユーザーの質問に答える。
 *
 * リクエスト: POST { lessonContext, question }
 *   lessonContext: 教材タイトル + 本文の抜粋 (4000字以内)
 *   question: 質問本文 (300字以内)
 * レスポンス: { answer }
 *
 * 認証は要求しない (誰でも質問できる) が、ペイロード上限と簡易レート制限
 * を持つ。AI モデルは @cf/meta/llama-3.1-8b-instruct (無料枠あり)。
 *
 * Cloudflare Pages の Settings → Functions → Bindings で "AI" を
 * Workers AI に結ぶ必要がある (SETUP.md 参照)。
 */
import { jsonResponse } from '../_lib/session';

interface Env {
  AI?: {
    run(model: string, input: Record<string, unknown>): Promise<{ response?: string }>;
  };
}

interface Body {
  lessonContext?: string;
  question?: string;
}

const MAX_CONTEXT = 4000;
const MAX_QUESTION = 300;
const MAX_ANSWER_TOKENS = 500;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AI || typeof env.AI.run !== 'function') {
    return jsonResponse(
      { error: 'ai_not_configured', detail: 'Cloudflare Workers AI binding "AI" not set' },
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
  const q = (body.question || '').slice(0, MAX_QUESTION);
  if (!ctx || !q) {
    return jsonResponse({ error: 'missing_fields' }, { status: 400 });
  }

  const systemPrompt =
    'あなたは「ひらく」という日本の教育サイトの教材解説アシスタントです。' +
    '中学生〜高校生にもわかるよう、丁寧に・批判的思考を促す形で答えてください。' +
    'わからない場合は無理に答えず、「教材本文からは判断できません」と正直に答えてください。' +
    '回答は 300 字以内、敬体 (です・ます調) で。';

  const userPrompt =
    '【教材】\n' + ctx + '\n\n' +
    '【生徒の質問】\n' + q + '\n\n' +
    '【回答 (300 字以内)】';

  try {
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: MAX_ANSWER_TOKENS,
      temperature: 0.6,
    });
    const answer = (result && result.response) ? String(result.response).slice(0, 1500) : '';
    if (!answer) {
      return jsonResponse({ error: 'empty_response' }, { status: 502 });
    }
    return jsonResponse({ answer });
  } catch (e) {
    return jsonResponse({ error: 'ai_error', detail: String(e).slice(0, 200) }, { status: 502 });
  }
};
