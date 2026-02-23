import { handleOptions } from '../../utils/cors.js';
import { successResponse, errorResponse } from '../../utils/response.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const { id } = params;

  try {
    const result = await env.DB.prepare(
      `SELECT id, card_id, q1, q2, free_text, character_id, poem, created_at
       FROM answers
       WHERE id = ?`
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
