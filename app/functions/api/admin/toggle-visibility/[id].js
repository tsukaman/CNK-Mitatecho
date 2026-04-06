import { successResponse, errorResponse } from '../../../utils/response.js';

// 認証は _middleware.js で一元処理

export async function onRequestPost(context) {
  const { env, params } = context;

  try {
    const { id } = params;
    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid id', 400);
    }

    // 現在の状態を取得
    const existing = await env.DB.prepare(
      'SELECT id, is_hidden FROM answers WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return errorResponse('Record not found', 404);
    }

    // トグル
    const newValue = existing.is_hidden ? 0 : 1;
    await env.DB.prepare(
      'UPDATE answers SET is_hidden = ? WHERE id = ?'
    ).bind(newValue, id).run();

    return successResponse({ id, is_hidden: newValue });
  } catch (err) {
    console.error('Toggle visibility error:', err);
    return errorResponse('Internal server error', 500);
  }
}
