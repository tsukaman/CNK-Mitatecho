import { handleOptions } from '../utils/cors.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { sanitizeText } from '../utils/sanitizer.js';
import { getCharacterId } from '../utils/mapping.js';
import { generatePoem } from '../utils/poem-generator.js';
import { getPromptContext } from '../utils/scenarios-server.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Rate limit: 10 req / 60s / IP （D1 の rate_limits テーブルを UPSERT でカウント）
    // IP 取得不可時は制限せず通過（NAT/特殊経路での誤集約を回避、fail-open）
    // D1 例外時も通過（可用性優先）
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip && env.DB) {
      try {
        const now = Math.floor(Date.now() / 1000);
        const windowSec = 60;
        const maxCount = 10;
        const result = await env.DB.prepare(
          `INSERT INTO rate_limits (key, count, window_start)
           VALUES (?1, 1, ?2)
           ON CONFLICT(key) DO UPDATE SET
             count = CASE WHEN rate_limits.window_start + ?3 <= ?2 THEN 1 ELSE rate_limits.count + 1 END,
             window_start = CASE WHEN rate_limits.window_start + ?3 <= ?2 THEN ?2 ELSE rate_limits.window_start END
           RETURNING count`
        ).bind(`submit:${ip}`, now, windowSec).first();
        if (result && result.count > maxCount) {
          return errorResponse('投稿が集中しています。少し時間を置いて再度お試しください。', 429);
        }
      } catch (err) {
        console.warn('Rate limit D1 error (fail-open):', err.message);
      }
    }

    const body = await request.json();
    // 注意: q1_choice_text / q2_choice_text / q2_choice_type / sct_template は
    // プロンプトインジェクション対策のためクライアント入力を使わず、
    // card/q1/q2 からサーバ側で引き直す（getPromptContext）
    const { card, q1, q2, free_text, nickname, nickname_public } = body;

    // Validation
    if (!Number.isInteger(card) || card < 1 || card > 6) {
      return errorResponse('card must be 1-6', 400);
    }
    if (!Number.isInteger(q1) || q1 < 1 || q1 > 4) {
      return errorResponse('q1 must be 1-4', 400);
    }
    if (!Number.isInteger(q2) || q2 < 1 || q2 > 4) {
      return errorResponse('q2 must be 1-4', 400);
    }
    if (typeof free_text !== 'string' || free_text.trim().length === 0) {
      return errorResponse('free_text is required', 400);
    }
    if (free_text.length > 200) {
      return errorResponse('free_text must be 200 chars or less', 400);
    }

    // Validate nickname if provided
    let sanitizedNickname = null;
    if (nickname && typeof nickname === 'string' && nickname.trim().length > 0) {
      const trimmed = nickname.trim();
      if (trimmed.length > 30) {
        return errorResponse('nickname must be 30 chars or less', 400);
      }
      sanitizedNickname = sanitizeText(trimmed);
    }

    // 公開扱い: true / 1 / "true" / "1" のみ（"false" などの文字列 truthy 誤判定を回避）
    const nicknamePublicFlag = (
      nickname_public === true ||
      nickname_public === 1 ||
      nickname_public === 'true' ||
      nickname_public === '1'
    ) ? 1 : 0;

    // Determine character
    const character_id = getCharacterId(card, q1, q2);
    if (!character_id) {
      return errorResponse('Invalid card/q1/q2 combination', 400);
    }

    // Generate ID
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    // Sanitize free text
    const sanitized_text = sanitizeText(free_text);

    // Save to D1
    await env.DB.prepare(
      `INSERT INTO answers (id, card_id, q1, q2, free_text, character_id, nickname, nickname_public, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(id, card, q1, q2, sanitized_text, character_id, sanitizedNickname, nicknamePublicFlag).run();

    // Generate poem asynchronously (non-blocking, update DB after)
    // waitUntil keeps the worker alive until the async task completes
    // プロンプト文脈はサーバ側で card/q1/q2 から引き直す（クライアントを信用しない）
    const promptCtx = getPromptContext(card, q1, q2);
    const poemPromise = generatePoem({
      env, id, character_id, free_text: sanitized_text,
      q1_choice_text: promptCtx.q1_choice_text,
      q2_choice_text: promptCtx.q2_choice_text,
      q2_choice_type: promptCtx.q2_choice_type,
      sct_template: promptCtx.sct_template,
    }).catch((err) => {
      console.error('Poem generation failed:', err);
    });
    context.waitUntil(poemPromise);

    return successResponse({ id, character_id });
  } catch (err) {
    console.error('Submit error:', err.message, err.stack);
    return errorResponse('Internal server error', 500);
  }
}
