import { successResponse, errorResponse } from '../../utils/response.js';

// 認証は _middleware.js で一元処理

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const card = url.searchParams.get('card');
    const visibility = url.searchParams.get('visibility');

    // WHERE条件を組み立て
    const conditions = [];
    const binds = [];

    if (card) {
      const cardNum = parseInt(card, 10);
      if (!Number.isInteger(cardNum) || cardNum < 1 || cardNum > 6) {
        return errorResponse('card must be 1-6', 400);
      }
      conditions.push('card_id = ?');
      binds.push(cardNum);
    }

    if (visibility === 'hidden') {
      conditions.push('is_hidden = 1');
    } else if (visibility === 'visible') {
      conditions.push('is_hidden = 0');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const results = await env.DB.prepare(
      `SELECT id, card_id, free_text, character_id, nickname, nickname_public, poem, is_hidden, created_at
       FROM answers ${where}
       ORDER BY created_at DESC`
    ).bind(...binds).all();

    return successResponse({ entries: results.results, total: results.results.length });
  } catch (err) {
    console.error('Admin list error:', err);
    return errorResponse('Internal server error', 500);
  }
}
