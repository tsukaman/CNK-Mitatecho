import { handleOptions } from '../../utils/cors.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!env.ADMIN_API_KEY || authHeader !== `Bearer ${env.ADMIN_API_KEY}`) {
      return errorResponse('Unauthorized', 401);
    }

    const url = new URL(request.url);
    const card = url.searchParams.get('card');

    let results;
    if (card) {
      const cardNum = parseInt(card, 10);
      if (!Number.isInteger(cardNum) || cardNum < 1 || cardNum > 6) {
        return errorResponse('card must be 1-6', 400);
      }
      results = await env.DB.prepare(
        `SELECT id, card_id, free_text, character_id, nickname, nickname_public, poem, created_at
         FROM answers WHERE card_id = ?
         ORDER BY created_at DESC`
      ).bind(cardNum).all();
    } else {
      // カード指定なしなら全件
      results = await env.DB.prepare(
        `SELECT id, card_id, free_text, character_id, nickname, nickname_public, poem, created_at
         FROM answers ORDER BY created_at DESC`
      ).all();
    }

    return successResponse({ entries: results.results, total: results.results.length });
  } catch (err) {
    console.error('Admin list error:', err);
    return errorResponse('Internal server error', 500);
  }
}
