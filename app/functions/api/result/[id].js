import { handleOptions } from '../../utils/cors.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const { id } = params;

  try {
    // is_hidden=1 のエントリは公開しない。管理者は /api/admin/list で確認可能。
    const result = await env.DB.prepare(
      `SELECT id, card_id, q1, q2, free_text, character_id, poem, poem_status, created_at
       FROM answers
       WHERE id = ? AND is_hidden = 0`
    ).bind(id).first();

    if (!result) {
      return errorResponse('Result not found', 404);
    }

    return successResponse(result);
  } catch (err) {
    console.error('Result error:', err);
    return errorResponse('Internal server error', 500);
  }
}
