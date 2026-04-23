import { handleOptions } from '../utils/cors.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const card = parseInt(url.searchParams.get('card'), 10);

    if (!Number.isInteger(card) || card < 1 || card > 6) {
      return errorResponse('card must be 1-6', 400);
    }

    // nickname は nickname_public=1 の場合のみ返す（サーバ側で強制フィルタ）
    const nicknameExpr = 'CASE WHEN nickname_public = 1 THEN nickname ELSE NULL END AS nickname';

    // 最新3件 + 非最新からランダム5件（最大8件）を 2 クエリで取得。
    // 事前 COUNT を廃止し D1 round trip を 3 → 2 に削減。
    // 件数が少ないカードでも同じロジックで破綻なし
    // (例: 5件なら latest=3, random=2, 合計5件が返る)。
    const latest = await env.DB.prepare(
      `SELECT id, free_text, character_id, ${nicknameExpr}, nickname_public, created_at
       FROM answers WHERE card_id = ? AND is_hidden = 0
       ORDER BY created_at DESC LIMIT 3`
    ).bind(card).all();

    const latestIds = latest.results.map(r => r.id);
    let randomEntries = [];
    if (latestIds.length > 0) {
      const placeholders = latestIds.map(() => '?').join(',');
      const random = await env.DB.prepare(
        `SELECT free_text, character_id, ${nicknameExpr}, nickname_public, created_at
         FROM answers WHERE card_id = ? AND is_hidden = 0 AND id NOT IN (${placeholders})
         ORDER BY RANDOM() LIMIT 5`
      ).bind(card, ...latestIds).all();
      randomEntries = random.results;
    }

    const entries = [
      ...latest.results.map(({ free_text, character_id, nickname, nickname_public, created_at }) =>
        ({ free_text, character_id, nickname, nickname_public, created_at })),
      ...randomEntries,
    ];

    return successResponse({ entries });
  } catch (err) {
    console.error('Gallery error:', err);
    return errorResponse('Internal server error', 500);
  }
}
