import { handleOptions } from '../utils/cors.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function onRequestOptions() {
  return handleOptions();
}

/**
 * GET /api/poems?limit=N
 * 全カード横断で短歌付きの最新エントリーを返す（ランディングページ用）
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const parsed = parseInt(url.searchParams.get('limit'), 10);
    // 負値や NaN を弾き、1〜30 の範囲に収める
    const limit = Math.max(1, Math.min(Number.isFinite(parsed) ? parsed : 12, 30));

    const result = await env.DB.prepare(
      `SELECT poem, character_id, card_id,
              CASE WHEN nickname_public = 1 THEN nickname ELSE NULL END AS nickname,
              nickname_public, created_at
       FROM answers
       WHERE poem IS NOT NULL AND poem != '' AND is_hidden = 0
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(limit).all();

    return successResponse({ entries: result.results });
  } catch (err) {
    console.error('Poems error:', err);
    return errorResponse('Internal server error', 500);
  }
}
