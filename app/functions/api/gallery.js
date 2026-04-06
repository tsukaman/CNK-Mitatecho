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

    // Count total entries for this card
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM answers WHERE card_id = ? AND is_hidden = 0`
    ).bind(card).first();

    const total = countResult?.total || 0;

    // If 8 or fewer, return all
    if (total <= 8) {
      const all = await env.DB.prepare(
        `SELECT free_text, character_id, nickname, nickname_public, created_at
         FROM answers WHERE card_id = ? AND is_hidden = 0
         ORDER BY created_at DESC`
      ).bind(card).all();
      return successResponse({ entries: all.results });
    }

    // Latest 3
    const latest = await env.DB.prepare(
      `SELECT id, free_text, character_id, nickname, nickname_public, created_at
       FROM answers WHERE card_id = ? AND is_hidden = 0
       ORDER BY created_at DESC LIMIT 3`
    ).bind(card).all();

    const latestIds = latest.results.map(r => r.id);

    // Random 5 (excluding latest 3)
    const placeholders = latestIds.map(() => '?').join(',');
    const random = await env.DB.prepare(
      `SELECT free_text, character_id, nickname, nickname_public, created_at
       FROM answers WHERE card_id = ? AND is_hidden = 0 AND id NOT IN (${placeholders})
       ORDER BY RANDOM() LIMIT 5`
    ).bind(card, ...latestIds).all();

    // Combine: latest first, then random
    const entries = [
      ...latest.results.map(({ free_text, character_id, nickname, nickname_public, created_at }) => ({ free_text, character_id, nickname, nickname_public, created_at })),
      ...random.results,
    ];

    return successResponse({ entries });
  } catch (err) {
    console.error('Gallery error:', err);
    return errorResponse('Internal server error', 500);
  }
}
