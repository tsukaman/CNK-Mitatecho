import { successResponse, errorResponse } from '../../../utils/response.js';

// 認証は _middleware.js で一元処理

export async function onRequestPost(context) {
  const { env, params } = context;

  try {
    const { id } = params;
    if (!id || typeof id !== 'string') {
      return errorResponse('Invalid id', 400);
    }

    // 単一 UPDATE で原子的にトグル（同時更新の race condition を回避）
    const toggled = await env.DB.prepare(
      'UPDATE answers SET is_hidden = 1 - is_hidden WHERE id = ? RETURNING is_hidden'
    ).bind(id).first();

    if (!toggled) {
      return errorResponse('Record not found', 404);
    }

    return successResponse({ id, is_hidden: toggled.is_hidden });
  } catch (err) {
    console.error('Toggle visibility error:', err);
    return errorResponse('Internal server error', 500);
  }
}
