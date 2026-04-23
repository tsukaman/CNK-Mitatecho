import { successResponse, errorResponse } from '../../utils/response.js';

// 認証は _middleware.js で一元処理

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const card = url.searchParams.get('card');
    const visibility = url.searchParams.get('visibility');
    const limitRaw = url.searchParams.get('limit');
    const offsetRaw = url.searchParams.get('offset');

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

    let limit = DEFAULT_LIMIT;
    if (limitRaw !== null) {
      const n = parseInt(limitRaw, 10);
      if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
        return errorResponse(`limit must be 1-${MAX_LIMIT}`, 400);
      }
      limit = n;
    }

    let offset = 0;
    if (offsetRaw !== null) {
      const n = parseInt(offsetRaw, 10);
      if (!Number.isInteger(n) || n < 0) {
        return errorResponse('offset must be >= 0', 400);
      }
      offset = n;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM answers ${where}`,
    ).bind(...binds).first();
    const total = countRow ? Number(countRow.total) : 0;

    const results = await env.DB.prepare(
      `SELECT id, card_id, free_text, character_id, nickname, nickname_public, poem, poem_status, is_hidden, created_at
       FROM answers ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    ).bind(...binds, limit, offset).all();

    return successResponse({
      entries: results.results,
      total,
      limit,
      offset,
      hasMore: offset + results.results.length < total,
    });
  } catch (err) {
    console.error('Admin list error:', err);
    return errorResponse('Internal server error', 500);
  }
}
